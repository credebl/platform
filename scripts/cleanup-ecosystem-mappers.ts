/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as dotenv from 'dotenv';
import * as http from 'http';
import * as https from 'https';
import * as querystring from 'querystring';

dotenv.config();

const { KEYCLOAK_DOMAIN } = process.env;
const { KEYCLOAK_REALM } = process.env;
const { KEYCLOAK_MANAGEMENT_CLIENT_ID } = process.env;
const { KEYCLOAK_MANAGEMENT_CLIENT_SECRET } = process.env;

const log = (msg: string): void => console.log(`[CLEANUP] ${msg}`);

function request(method: string, url: string, token?: string, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = 'https:' === parsed.protocol;
    const lib = isHttps ? https : http;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Type'] =
        'POST' === method && url.includes('token') ? 'application/x-www-form-urlencoded' : 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body).toString();
    }

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (400 <= res.statusCode) {
            reject(new Error(`${method} ${url} returned ${res.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch {
            resolve(data);
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function getToken(): Promise<string> {
  const url = `${KEYCLOAK_DOMAIN}realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const body = querystring.stringify({
    client_id: KEYCLOAK_MANAGEMENT_CLIENT_ID,
    client_secret: KEYCLOAK_MANAGEMENT_CLIENT_SECRET,
    grant_type: 'client_credentials'
  });
  const res = await request('POST', url, null, body);
  return res.access_token;
}

async function removeProfileScopeMapper(token: string): Promise<void> {
  log('--- Removing "ecosystem_access" from "profile" client scope ---');

  const scopesUrl = `${KEYCLOAK_DOMAIN}admin/realms/${KEYCLOAK_REALM}/client-scopes`;
  const scopes = await request('GET', scopesUrl, token);
  const profileScope = scopes.find((s: { name: string }) => 'profile' === s.name);

  if (!profileScope) {
    log('"profile" client scope not found');
    return;
  }

  const mappersUrl = `${scopesUrl}/${profileScope.id}/protocol-mappers/models`;
  const mappers = await request('GET', mappersUrl, token);
  const mapper = mappers.find((m: { name: string }) => 'ecosystem_access' === m.name);

  if (!mapper) {
    log('"ecosystem_access" mapper not found in "profile" scope - nothing to delete');
    return;
  }

  await request('DELETE', `${mappersUrl}/${mapper.id}`, token);
  log(`DELETED "ecosystem_access" mapper (id: ${mapper.id}) from "profile" client scope`);
}

async function removeClientMappers(token: string): Promise<void> {
  log('');
  log('--- Removing "ecosystem_access_mapper" from all clients ---');

  const clientsUrl = `${KEYCLOAK_DOMAIN}admin/realms/${KEYCLOAK_REALM}/clients?max=1000`;
  const clients = await request('GET', clientsUrl, token);

  const systemClients = ['admin-cli', 'account', 'account-console', 'broker', 'security-admin-console'];

  let deleted = 0;
  let notFound = 0;

  for (const client of clients) {
    if (client.clientId.startsWith('realm-') || client.bearerOnly || systemClients.includes(client.clientId)) {
      continue;
    }

    const mappersUrl = `${KEYCLOAK_DOMAIN}admin/realms/${KEYCLOAK_REALM}/clients/${client.id}/protocol-mappers/models`;
    const mappers = await request('GET', mappersUrl, token);
    const mapper = mappers.find((m: { name: string }) => 'ecosystem_access_mapper' === m.name);

    if (!mapper) {
      log(`  [${client.clientId}] no "ecosystem_access_mapper" - skipped`);
      notFound++;
      continue;
    }

    await request('DELETE', `${mappersUrl}/${mapper.id}`, token);
    log(`  [${client.clientId}] DELETED "ecosystem_access_mapper" (id: ${mapper.id})`);
    deleted++;
  }

  log(`Client mapper summary: ${deleted} deleted, ${notFound} not found`);
}

async function removeUserAttributes(token: string): Promise<void> {
  log('');
  log('--- Removing "ecosystem_access" attribute from all users ---');

  const usersUrl = `${KEYCLOAK_DOMAIN}admin/realms/${KEYCLOAK_REALM}/users?max=500`;
  const users = await request('GET', usersUrl, token);

  let cleaned = 0;
  let skipped = 0;

  for (const user of users) {
    const hasAttr = user.attributes?.ecosystem_access && 0 < user.attributes.ecosystem_access.length;

    if (!hasAttr) {
      skipped++;
      continue;
    }

    log(`  [${user.username}] (${user.id}) - removing ecosystem_access attribute`);

    const userUrl = `${KEYCLOAK_DOMAIN}admin/realms/${KEYCLOAK_REALM}/users/${user.id}`;
    delete user.attributes.ecosystem_access;

    await request('PUT', userUrl, token, JSON.stringify(user));
    log(`  [${user.username}] DONE`);
    cleaned++;
  }

  log(`User attribute summary: ${cleaned} cleaned, ${skipped} had no attribute`);
}

async function main(): Promise<void> {
  log('========================================');
  log('=== Ecosystem Access Mapper Cleanup  ===');
  log('========================================');
  log(`Keycloak: ${KEYCLOAK_DOMAIN}`);
  log(`Realm: ${KEYCLOAK_REALM}`);
  log('');

  const token = await getToken();
  log('Management token obtained');
  log('');

  await removeProfileScopeMapper(token);
  await removeClientMappers(token);
  await removeUserAttributes(token);

  log('');
  log('========================================');
  log('=== Cleanup Complete                 ===');
  log('========================================');
  log('');
  log('Now restart the API Gateway to re-apply configurations.');
}

main().catch((err) => {
  console.error('[CLEANUP] FAILED:', err.message || err);
  process.exit(1);
});
