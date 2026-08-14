import * as fs from 'node:fs';
import * as net from 'node:net';
import * as path from 'node:path';
import * as tls from 'node:tls';

import * as nodemailer from 'nodemailer';

import { buildSmtpTransportConfig, sendWithSMTP } from './smtp-helper-file';
import { EmailDto } from './dtos/email.dto';

const SMTP_TEST_FIXTURES = path.join(__dirname, '__fixtures__', 'smtp');
const SMTP_TEST_CERT = fs.readFileSync(path.join(SMTP_TEST_FIXTURES, 'server-cert.pem'), 'utf8');

interface CapturedMail {
  from?: string;
  recipients: string[];
  data: string;
  tls: boolean;
  auth?: string;
}

interface AttachOptions {
  tlsEnabled: boolean;
  sendGreeting: boolean;
}

interface TestSmtpServerOptions {
  secure: boolean;
  advertiseStarttls?: boolean;
}

/**
 * Minimal in-process SMTP server used to exercise the real nodemailer wire
 * protocol (plaintext, implicit TLS and STARTTLS). It accepts a single
 * authenticated session and captures the delivered message.
 */
class TestSmtpServer {
  readonly mail: CapturedMail[] = [];
  private readonly secure: boolean;
  private readonly advertiseStarttls: boolean;
  private readonly cert: string;
  private readonly key: string;
  private server?: net.Server;
  private readonly connections = new Set<net.Socket>();

  constructor(options: TestSmtpServerOptions) {
    this.secure = options.secure;
    this.advertiseStarttls = options.secure ? false : (options.advertiseStarttls ?? false);
    this.cert = SMTP_TEST_CERT;
    this.key = fs.readFileSync(path.join(SMTP_TEST_FIXTURES, 'server-key.pem'), 'utf8');
  }

  async start(port: number): Promise<void> {
    const handler = (socket: net.Socket): void => {
      this.connections.add(socket);
      socket.on('close', () => {
        this.connections.delete(socket);
      });
      this.attachConnection(socket, { tlsEnabled: this.secure, sendGreeting: true });
    };
    this.server = this.secure
      ? tls.createServer({ cert: this.cert, key: this.key }, handler)
      : net.createServer(handler);
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(port, '127.0.0.1', () => {
        this.server!.removeListener('error', reject);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }
    for (const connection of this.connections) {
      connection.destroy();
    }
    this.connections.clear();
    const { server } = this;
    this.server = undefined;
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  }

  private attachConnection(socket: net.Socket, options: AttachOptions): void {
    let buffer = '';
    let inData = false;
    let pendingAuth = false;
    let captured = false;
    let from: string | undefined;
    let mailData = '';
    const recipients: string[] = [];
    let auth: string | undefined;

    const respond = (text: string): void => {
      socket.write(`${text}\r\n`);
    };

    const pushCaptured = (): void => {
      if (captured || (undefined === from && 0 === recipients.length)) {
        return;
      }
      captured = true;
      this.mail.push({ from, recipients: [...recipients], data: mailData, tls: options.tlsEnabled, auth });
    };

    const handleCommand = (line: string): void => {
      const upper = line.toUpperCase();
      if (upper.startsWith('EHLO')) {
        const capabilities = ['250-localhost', '250-SIZE 35882577', '250-8BITMIME', '250-SMTPUTF8'];
        if (this.advertiseStarttls) {
          capabilities.push('250-STARTTLS');
        }
        capabilities.push('250 AUTH PLAIN');
        respond(capabilities.join('\r\n'));
        return;
      }
      if (upper.startsWith('HELO')) {
        respond('250 localhost');
        return;
      }
      if (pendingAuth) {
        auth = line.trim();
        pendingAuth = false;
        respond('235 2.7.0 Authentication successful');
        return;
      }
      if (upper.startsWith('AUTH')) {
        const [, , authToken] = line.split(/\s+/);
        if (undefined !== authToken) {
          auth = authToken;
          respond('235 2.7.0 Authentication successful');
        } else {
          pendingAuth = true;
          respond('334 ');
        }
        return;
      }
      if ('STARTTLS' === upper) {
        respond('220 2.0.0 Ready to start TLS');
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        socket.removeAllListeners('close');
        const tlsSocket = new tls.TLSSocket(socket, {
          isServer: true,
          secureContext: tls.createSecureContext({ cert: this.cert, key: this.key })
        });
        tlsSocket.on('error', () => {
          // ignore handshake errors surfaced by the test client
        });
        this.attachConnection(tlsSocket, { tlsEnabled: true, sendGreeting: false });
        return;
      }
      if (upper.startsWith('MAIL FROM')) {
        from = line
          .slice(line.toUpperCase().indexOf('FROM:') + 5)
          .trim()
          .replace(/^</, '')
          .replace(/>.*$/, '');
        respond('250 OK');
        return;
      }
      if (upper.startsWith('RCPT TO')) {
        recipients.push(
          line
            .slice(line.toUpperCase().indexOf('TO:') + 3)
            .trim()
            .replace(/^</, '')
            .replace(/>.*$/, '')
        );
        respond('250 OK');
        return;
      }
      if ('DATA' === upper) {
        inData = true;
        respond('354 End data with <CR><LF>.<CR><LF>');
        return;
      }
      if ('QUIT' === upper) {
        respond('221 2.0.0 Bye');
        pushCaptured();
        socket.end();
        return;
      }
      if ('RSET' === upper || 'NOOP' === upper) {
        respond('250 OK');
        return;
      }
      respond('250 OK');
    };

    if (options.sendGreeting) {
      respond('220 localhost ESMTP credebl-test');
    }

    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      for (;;) {
        if (inData) {
          const terminator = buffer.indexOf('\r\n.\r\n');
          if (-1 === terminator) {
            break;
          }
          mailData = buffer.slice(0, terminator);
          buffer = buffer.slice(terminator + 5);
          inData = false;
          pushCaptured();
          respond('250 OK: message queued');
          continue;
        }
        const lineEnd = buffer.indexOf('\r\n');
        if (-1 === lineEnd) {
          break;
        }
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        handleCommand(line);
      }
    });

    socket.on('close', () => {
      pushCaptured();
    });
  }
}

describe('sendWithSMTP with a real SMTP transport (nodemailer 9)', () => {
  const pristineEnv = { ...process.env };
  const emailDto: EmailDto = {
    emailFrom: 'from@credebl.id',
    emailTo: ['to@example.com'],
    emailSubject: 'integration subject',
    emailText: 'plain text body',
    emailHtml: '<p>html body</p>'
  };
  let server: TestSmtpServer;

  beforeAll(() => {
    jest.setTimeout(15000);
  });

  beforeEach(() => {
    delete process.env.ENABLE_BAO;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
    process.env = { ...pristineEnv };
  });

  it('delivers mail over plain SMTP with the correct message content', async () => {
    server = new TestSmtpServer({ secure: false });
    await server.start(2525);
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';

    await expect(sendWithSMTP(emailDto)).resolves.toBe(true);

    expect(server.mail).toHaveLength(1);
    const [message] = server.mail;
    expect(message.tls).toBe(false);
    expect(message.from).toBe(emailDto.emailFrom);
    expect(message.recipients).toEqual(emailDto.emailTo);
    expect(message.auth).toBeDefined();
    expect(message.data).toContain(`Subject: ${emailDto.emailSubject}`);
    expect(message.data).toContain('plain text body');
    expect(message.data).toContain('<p>html body</p>');
  });

  it('delivers attachments over plain SMTP', async () => {
    server = new TestSmtpServer({ secure: false });
    await server.start(2525);
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';

    const withAttachment: EmailDto = {
      ...emailDto,
      emailAttachments: [
        {
          content: Buffer.from('attachment-content').toString('base64'),
          filename: 'note.txt',
          contentType: 'text/plain'
        }
      ]
    };

    await expect(sendWithSMTP(withAttachment)).resolves.toBe(true);

    expect(server.mail).toHaveLength(1);
    expect(server.mail[0].data).toContain('note.txt');
    expect(server.mail[0].data).toContain('WVhSMFlXTm9iV1Z1ZEMxamIyNTBaVzUw');
  });

  it('builds an implicit-TLS config for port 465 and completes a TLS handshake', async () => {
    const config = buildSmtpTransportConfig('127.0.0.1', '465', 'user', 'pass');
    expect(config.secure).toBe(true);
    expect(config.requireTLS).toBe(false);

    server = new TestSmtpServer({ secure: true });
    await server.start(4465);
    const transporter = nodemailer.createTransport({
      ...config,
      port: 4465,
      tls: { ca: [SMTP_TEST_CERT], servername: 'localhost' }
    });
    await transporter.sendMail({
      from: emailDto.emailFrom,
      to: emailDto.emailTo,
      subject: emailDto.emailSubject,
      text: emailDto.emailText,
      html: emailDto.emailHtml
    });

    expect(server.mail).toHaveLength(1);
    expect(server.mail[0].tls).toBe(true);
    expect(server.mail[0].recipients).toEqual(emailDto.emailTo);
  });

  it('builds a STARTTLS config for port 587 and upgrades the connection', async () => {
    const config = buildSmtpTransportConfig('127.0.0.1', '587', 'user', 'pass');
    expect(config.requireTLS).toBe(true);
    expect(config.secure).toBe(false);

    server = new TestSmtpServer({ secure: false, advertiseStarttls: true });
    await server.start(4587);
    const transporter = nodemailer.createTransport({
      ...config,
      port: 4587,
      tls: { ca: [SMTP_TEST_CERT], servername: 'localhost' }
    });
    await transporter.sendMail({
      from: emailDto.emailFrom,
      to: emailDto.emailTo,
      subject: emailDto.emailSubject,
      text: emailDto.emailText,
      html: emailDto.emailHtml
    });

    expect(server.mail).toHaveLength(1);
    expect(server.mail[0].tls).toBe(true);
    expect(server.mail[0].recipients).toEqual(emailDto.emailTo);
  });
});
