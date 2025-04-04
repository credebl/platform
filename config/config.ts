import { Validator, ConfigSchema } from './env-validation';

// --------------------------------------------------------------------------------

const v = new Validator();

const mySchema = new ConfigSchema({
  API_GATEWAY_PROTOCOL: v.protocol,
  API_GATEWAY_HOST: v.host,
  API_GATEWAY_PORT: v.port,
  API_GATEWAY_PROTOCOL_SECURE: v.protocol,
  API_ENDPOINT: v.endpoint,

  FRONT_END_URL: v.url,

  MOBILE_APP: v.exists,
  MOBILE_APP_NAME: v.exists,
  MOBILE_APP_DOWNLOAD_URL: v.url,
  PLAY_STORE_DOWNLOAD_LINK: v.url,
  IOS_DOWNLOAD_LINK: v.url,

  PLATFORM_NAME: v.exists,
  POWERED_BY: v.exists,
  PLATFORM_WEB_URL: v.url,
  POWERED_BY_URL: v.url,
  UPLOAD_LOGO_HOST: v.host,
  BRAND_LOGO: v.url,
  PLATFORM_ADMIN_EMAIL: v.email,

  SOCKET_HOST: v.host
});

const { errors, success, data } = mySchema.safeParse();

if (!success) {
  throw errors;
}

export const { API_GATEWAY_PROTOCOL, API_GATEWAY_PORT } = data;
