import { createServer, Server } from 'node:http';

import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';

import { CommonService } from './common.service';

describe('CommonService — real HTTP via @nestjs/axios (axios 1.18)', () => {
  const pristineEnv = { ...process.env };
  let targetServer: Server;
  let targetPort: number;
  let proxyServer: Server;
  let proxyPort: number;
  let proxyHits: string[] = [];
  let commonService: CommonService;

  beforeAll(async () => {
    targetServer = createServer((req, res) => {
      if ('POST' === req.method) {
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString('utf8');
        });
        req.on('end', () => {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ echoed: body }));
        });
        return;
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, path: req.url }));
    });
    await new Promise<void>((resolve) => targetServer.listen(0, '127.0.0.1', resolve));
    const targetAddress = targetServer.address();
    targetPort = 'object' === typeof targetAddress ? targetAddress.port : 0;

    proxyServer = createServer((req, res) => {
      proxyHits.push(String(req.url));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ proxied: true, url: req.url }));
    });
    await new Promise<void>((resolve) => proxyServer.listen(0, '127.0.0.1', resolve));
    const proxyAddress = proxyServer.address();
    proxyPort = 'object' === typeof proxyAddress ? proxyAddress.port : 0;

    const moduleFixture = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [CommonService]
    }).compile();
    commonService = moduleFixture.get(CommonService);
  });

  beforeEach(() => {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.NO_PROXY;
    process.env.NO_PROXY = '127.0.0.1,localhost';
    proxyHits = [];
  });

  afterEach(() => {
    process.env = { ...pristineEnv };
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => targetServer.close(() => resolve()));
    await new Promise<void>((resolve) => proxyServer.close(() => resolve()));
  });

  it('performs a real GET through HttpService', async () => {
    const data = await commonService.httpGet(`http://127.0.0.1:${targetPort}/health`);

    expect(data).toEqual({ ok: true, path: '/health' });
  });

  it('performs a real POST with a JSON payload through HttpService', async () => {
    const data = await commonService.httpPost(
      `http://127.0.0.1:${targetPort}/echo`,
      { hello: 'world' },
      { headers: { 'content-type': 'application/json' } }
    );

    expect(data.echoed).toContain('hello');
  });

  it('routes the request through the configured HTTP proxy', async () => {
    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
    process.env.NO_PROXY = '';

    const data = await commonService.httpGet(`http://127.0.0.1:${targetPort}/via-proxy`);

    expect(data).toEqual({ proxied: true, url: `http://127.0.0.1:${targetPort}/via-proxy` });
    expect(proxyHits).toHaveLength(1);
  });
});
