#!/usr/bin/env node
/**
 * Reference CLI/API client for encrypted DID key import.
 *
 * It performs the same two steps as Studio:
 *   1. request a single-use import session (the agent returns an ephemeral RSA public key),
 *   2. encrypt the private key in this process and send only the JWE envelope.
 *
 * The plaintext key never leaves the machine, so it cannot appear in gateway, NATS or agent service logs.
 *
 * Usage (platform gateway):
 *   node scripts/import-did-key.mjs \
 *     --token "$ACCESS_TOKEN" --org "$ORG_ID" \
 *     --method web --domain example.com --key ./private.pem
 *
 * Usage (directly against an agent with an agent API key):
 *   node scripts/import-did-key.mjs \
 *     --agent http://127.0.0.1:4001 --api-key "$AGENT_API_KEY" \
 *     --method key --key ./private.pem
 *
 * Node 18+ only (uses global fetch and WebCrypto style node:crypto APIs).
 */
import { constants, createCipheriv, createPublicKey, publicEncrypt, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    gateway: { type: 'string', default: 'http://127.0.0.1:5050' },
    agent: { type: 'string' },
    org: { type: 'string' },
    token: { type: 'string' },
    'api-key': { type: 'string' },
    method: { type: 'string' },
    key: { type: 'string' },
    passphrase: { type: 'string' },
    did: { type: 'string' },
    domain: { type: 'string' },
    network: { type: 'string' },
    'verification-method-type': { type: 'string' },
    primary: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false }
  }
});

if (args.help) {
  console.log(await readFile(new URL(import.meta.url), 'utf8'));
  process.exit(0);
}

const method = (args.method ?? '').toLowerCase();
if (!['key', 'web'].includes(method)) {
  fail('--method must be `key` or `web`');
}
if (!args.key) fail('--key is required');
if (method === 'web' && !args.domain && !args.did) fail('--domain or --did is required for did:web');

const direct = Boolean(args.agent);
if (direct) {
  if (!args['api-key']) fail('--api-key is required with --agent');
} else if (!args.org || !args.token) {
  fail('--org and --token are required (or use --agent with --api-key)');
}

const privateKeyMaterial = await readPrivateKey(args.key, args.passphrase);
const session = await createSession(method);
const encryptedKey = encryptEnvelope(session, privateKeyMaterial);

const url = direct
  ? `${trimSlash(args.agent)}/dids/write`
  : `${trimSlash(args.gateway)}/orgs/${args.org}/agents/did`;

const payload = {
  method,
  ...(method === 'web' ? { domain: args.domain } : {}),
  ...(args.network ? { network: args.network } : {}),
  ...(args.did ? { did: args.did } : {}),
  ...(args['verification-method-type'] ? { verificationMethodType: args['verification-method-type'] } : {}),
  ...(!direct ? { isPrimaryDid: args.primary } : {}),
  encryptedKey
};

const response = await request(url, payload);
console.log(JSON.stringify(response, null, 2)); // NOSONAR - local operator CLI output, never a server log

async function readPrivateKey(path, passphrase) {
  const value = (await readFile(path, 'utf8')).trim(); // NOSONAR - local operator supplied path
  if (!value) fail('The key file is empty');

  if (value.startsWith('{')) {
    if (passphrase) fail('--passphrase only applies to an encrypted PEM key');
    try {
      return { privateKeyJwk: JSON.parse(value) };
    } catch {
      fail('The key file is not valid JSON');
    }
  }

  return { privateKey: value, ...(passphrase ? { passphrase } : {}) };
}

async function createSession(method) {
  const url = direct
    ? `${trimSlash(args.agent)}/dids/import/session`
    : `${trimSlash(args.gateway)}/orgs/${args.org}/agents/did/import/session`;

  const response = await request(url, { method }, direct ? { 'X-API-KEY': args['api-key'] } : {});
  // The gateway wraps the session in { statusCode, message, data }, the agent returns it directly.
  return response?.data && response?.statusCode ? response.data : response;
}

async function request(url, body, extraHeaders = {}) {
  const headers = {
    'content-type': 'application/json',
    ...(direct ? { authorization: args['api-key'], ...extraHeaders } : { authorization: `Bearer ${args.token}`, ...extraHeaders })
  };

  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }); // NOSONAR - local operator supplied URL
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { message: text };
  }

  if (!response.ok) {
    fail(`HTTP ${response.status}: ${parsed?.message ?? text}`, parsed);
  }
  return parsed;
}

function encryptEnvelope(session, material) {
  if (session.alg !== 'RSA-OAEP-256' || session.enc !== 'A256GCM') {
    fail(`Unsupported key import algorithm: ${session.alg}/${session.enc}`);
  }

  const protectedSegment = Buffer.from(JSON.stringify(session.protectedHeader), 'utf8').toString('base64url');
  const contentEncryptionKey = randomBytes(32);
  const publicKey = createPublicKey({ key: { kty: 'RSA', n: session.publicKeyJwk.n, e: session.publicKeyJwk.e }, format: 'jwk' });
  const encryptedKey = publicEncrypt(
    { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    contentEncryptionKey
  );

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', contentEncryptionKey, iv);
  cipher.setAAD(Buffer.from(protectedSegment, 'ascii'));
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(material), 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    sessionId: session.sessionId,
    jwe: [
      protectedSegment,
      encryptedKey.toString('base64url'),
      iv.toString('base64url'),
      ciphertext.toString('base64url'),
      tag.toString('base64url')
    ].join('.')
  };
}

function trimSlash(value) {
  return value.replace(/\/+$/, '');
}

function fail(message, details) {
  console.error(message); // NOSONAR - local operator CLI output, never a server log
  if (details) console.error(JSON.stringify(details, null, 2)); // NOSONAR - local operator CLI output
  process.exit(1);
}
