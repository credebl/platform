import { sendWithSMTP } from './smtp-helper-file';
import { fetchSecrets } from './utils/secretLoader.util';
import { CommonConstants } from './common.constant';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));
jest.mock('./utils/secretLoader.util', () => ({
  fetchSecrets: jest.fn()
}));

import * as nodemailer from 'nodemailer';
import { EmailDto } from './dtos/email.dto';

const mockedCreateTransport = nodemailer.createTransport as jest.Mock;
const mockedFetchSecrets = fetchSecrets as jest.MockedFunction<typeof fetchSecrets>;

const emailDto: EmailDto = {
  emailFrom: 'from@credebl.id',
  emailTo: ['to@example.com'],
  emailSubject: 'subject',
  emailText: 'text',
  emailHtml: '<p>html</p>'
};

describe('sendWithSMTP', () => {
  const originalEnv = { ...process.env };
  let sendMail: jest.Mock;

  beforeEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    sendMail = jest.fn().mockResolvedValue({ messageId: 'm1' });
    mockedCreateTransport.mockReturnValue({ sendMail });
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('sends an email using provider-sourced SMTP configuration', async () => {
    mockedFetchSecrets.mockResolvedValue({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass'
    });

    await expect(sendWithSMTP(emailDto)).resolves.toBe(true);

    expect(mockedFetchSecrets).toHaveBeenCalledWith(CommonConstants.SMTP_CONFIG);
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: 'user', pass: 'pass' }
      })
    );
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: emailDto.emailFrom }));
  });

  it('sets secure mode for port 465', async () => {
    mockedFetchSecrets.mockResolvedValue({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass'
    });

    await sendWithSMTP(emailDto);

    expect(mockedCreateTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: true, requireTLS: false }));
  });

  it('falls back to environment variables when no secrets are returned', async () => {
    mockedFetchSecrets.mockResolvedValue({});
    process.env.SMTP_HOST = 'smtp.env.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'env-user';
    process.env.SMTP_PASS = 'env-pass';

    await expect(sendWithSMTP(emailDto)).resolves.toBe(true);

    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.env.com', auth: { user: 'env-user', pass: 'env-pass' } })
    );
  });

  it('returns false when required SMTP configuration is missing', async () => {
    mockedFetchSecrets.mockResolvedValue({});

    await expect(sendWithSMTP(emailDto)).resolves.toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns false when the SMTP port is invalid', async () => {
    mockedFetchSecrets.mockResolvedValue({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 'not-a-number',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass'
    });

    await expect(sendWithSMTP(emailDto)).resolves.toBe(false);
  });

  it('returns false when sendMail rejects', async () => {
    mockedFetchSecrets.mockResolvedValue({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass'
    });
    sendMail.mockRejectedValue(new Error('connection refused'));

    await expect(sendWithSMTP(emailDto)).resolves.toBe(false);
  });
});
