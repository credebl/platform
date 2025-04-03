import * as dotenv from 'dotenv';
import validator from 'validator';

dotenv.config();

const {
  // MODE,
  // SUPABASE_URL,
  // SUPABASE_KEY,
  // SUPABASE_JWT_SECRET,
  API_GATEWAY_PROTOCOL,
  API_GATEWAY_HOST,
  API_GATEWAY_PORT,
  API_GATEWAY_PROTOCOL_SECURE
} = process.env;

// console.log({ SUPABASE_KEY, SUPABASE_JWT_SECRET });

// VALIDATION START ---------------------------------------------

export function isValidProtocol(protocol: string): boolean {
  return ['http', 'https'].includes(protocol);
}

export function isValidHost(host: string): boolean {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/g;

  return ipv4Regex.test(host) || 'localhost' === host;
}

// VALIDATION END---------------------------------------------

// if ('PROD' !== MODE && 'DEV' !== MODE) {
//   throw new Error('env.MODE must be "PROD" or "DEV".');
// }

// export { MODE };

// if (
//   !validator.isURL(SUPABASE_URL, {
//     protocols: ['http', 'https']
//   })
// ) {
//   throw new Error('env SUPABASE_URL is not an URL');
// }

// if (!SUPABASE_KEY) {
//   throw new Error('env SUPABASE_KEY value not set".');
// }

// if (!SUPABASE_JWT_SECRET) {
//   throw new Error('env SUPABASE_JWT_SECRET value not set".');
// }

// export const SUPABASE = {
//   URL: SUPABASE_URL,
//   KEY: SUPABASE_KEY,
//   JWT_SECRET: SUPABASE_JWT_SECRET
// };

if (!isValidProtocol(API_GATEWAY_PROTOCOL)) {
  throw new Error('env API_GATEWAY_PROTOCOL is not a valid protocol.');
}

if (!isValidHost(API_GATEWAY_HOST)) {
  throw new Error('env API_GATEWAY_HOST is not a valid host.');
}

if (!validator.isNumeric(API_GATEWAY_PORT)) {
  throw new Error('env API_GATEWAY_PORT is not a valid port.');
}

if (!isValidProtocol(API_GATEWAY_PROTOCOL_SECURE)) {
  throw new Error('env API_GATEWAY_PROTOCOL_SECURE is not a valid protocol.');
}

export const API_GATEWAY = {
  PROTOCOL: API_GATEWAY_PROTOCOL,
  HOST: API_GATEWAY_HOST,
  PORT: API_GATEWAY_PORT,
  PROTOCOL_SECURE: API_GATEWAY_PROTOCOL_SECURE
};
