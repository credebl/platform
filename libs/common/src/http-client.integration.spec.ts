import { createServer, Server } from 'node:http';

import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';

import { CommonService } from './common.service';

describe('CommonService — real HTTP via @nestjs/axios (axios 1.x)', () => {
  const pristineEnv = { ...process.env };
  let targetServer: Server;
  let targetPort: number;
  let proxyServer: Server;
  let proxyPort: number;
  let proxyHits: string[] = [];
  let commonService: CommonService;

  const baseUrl = (): string => `http://127.0.0.1:${targetPort}`;

  beforeAll(async () => {
    targetServer = createServer((req, res) => {
      const statusMatch = /^\/status-(\d{3})$/.exec(req.url ?? '');
      if (statusMatch) {
        res.statusCode = Number(statusMatch[1]);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: `status ${statusMatch[1]}`, url: req.url }));
        return;
      }
      if ('POST' === req.method || 'PATCH' === req.method || 'PUT' === req.method) {
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString('utf8');
        });
        req.on('end', () => {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ echoed: body, method: req.method, url: req.url }));
        });
        return;
      }
      if ('DELETE' === req.method) {
        res.statusCode = 204;
        res.end();
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
    const data = await commonService.httpGet(`${baseUrl()}/health`);

    expect(data).toEqual({ ok: true, path: '/health' });
  });

  it('performs a real POST with a JSON payload through HttpService', async () => {
    const data = await commonService.httpPost(
      `${baseUrl()}/echo`,
      { hello: 'world' },
      { headers: { 'content-type': 'application/json' } }
    );

    expect(data.echoed).toContain('hello');
  });

  it('performs a real PATCH through HttpService', async () => {
    const data = await commonService.httpPatch(
      `${baseUrl()}/resource/1`,
      { updated: true },
      { headers: { 'content-type': 'application/json' } }
    );

    expect(data.method).toBe('PATCH');
    expect(data.echoed).toContain('updated');
  });

  it('performs a real PUT and formats the response', async () => {
    const data = await commonService.httpPut(
      `${baseUrl()}/resource/1`,
      { replaced: true },
      { headers: { 'content-type': 'application/json' } }
    );

    expect(data).toEqual({
      message: 'fetched',
      success: true,
      data: { echoed: '{"replaced":true}', method: 'PUT', url: '/resource/1' }
    });
  });

  it('performs a real DELETE and returns the full response', async () => {
    const data = await commonService.httpDelete(`${baseUrl()}/resource/1`);

    expect(data.status).toBe(204);
    expect(data.data).toBe('');
  });

  it('translates a 404 response into a 404 HttpException', async () => {
    await expect(commonService.httpGet(`${baseUrl()}/status-404`)).rejects.toMatchObject({ status: 404 });
  });

  it('translates a 400 response into a 400 HttpException', async () => {
    await expect(commonService.httpGet(`${baseUrl()}/status-400`)).rejects.toMatchObject({ status: 400 });
  });

  it('translates a 422 response into a 422 HttpException', async () => {
    await expect(commonService.httpGet(`${baseUrl()}/status-422`)).rejects.toMatchObject({ status: 422 });
  });

  it('routes the request through the configured HTTP proxy', async () => {
    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
    process.env.NO_PROXY = '';

    const data = await commonService.httpGet(`${baseUrl()}/via-proxy`);

    expect(data).toEqual({ proxied: true, url: `${baseUrl()}/via-proxy` });
    expect(proxyHits).toHaveLength(1);
  });

  it('bypasses the proxy for hosts listed in NO_PROXY', async () => {
    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;

    const data = await commonService.httpGet(`${baseUrl()}/no-proxy`);

    expect(data).toEqual({ ok: true, path: '/no-proxy' });
    expect(proxyHits).toHaveLength(0);
  });

  it('bypasses the proxy entirely when NO_PROXY is a wildcard', async () => {
    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
    process.env.NO_PROXY = '*';

    const data = await commonService.httpGet(`${baseUrl()}/wildcard-no-proxy`);

    expect(data).toEqual({ ok: true, path: '/wildcard-no-proxy' });
    expect(proxyHits).toHaveLength(0);
  });
});
