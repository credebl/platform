import { v } from './validation/schema';

// --------------------------------------------------------------------------------

const schema = v.createSchema({
  API_GATEWAY_PROTOCOL: v.string().protocol(),
  API_GATEWAY_HOST: v.string().host(),
  API_GATEWAY_PORT: v.string().port(),
  API_GATEWAY_PROTOCOL_SECURE: v.string().protocol(),
  API_ENDPOINT: v.string().endpoint(),

  FRONT_END_URL: v.string().url(),

  MOBILE_APP: v.string().notEmpty(),
  MOBILE_APP_NAME: v.string().notEmpty(),
  MOBILE_APP_DOWNLOAD_URL: v.string().url(),
  PLAY_STORE_DOWNLOAD_LINK: v.string().url(), // tiene forma concreta
  IOS_DOWNLOAD_LINK: v.string().url(), // tiene forma concreta

  PLATFORM_NAME: v.string().notEmpty(),
  POWERED_BY: v.string().notEmpty(),
  PLATFORM_WEB_URL: v.string().url(),
  POWERED_BY_URL: v.string().url(),
  UPLOAD_LOGO_HOST: v.string().host(),
  BRAND_LOGO: v.string().url(),
  PLATFORM_ADMIN_EMAIL: v.string().email(),

  SOCKET_HOST: v.string().host(),

  NATS_HOST: v.string().host(),
  NATS_PORT: v.string().port(),
  NATS_URL: v.string().url(),

  REDIS_HOST: v.string().host(),
  REDIS_PORT: v.string().port(),

  WALLET_STORAGE_HOST: v.string().host(),
  WALLET_STORAGE_PORT: v.string().port(),
  WALLET_STORAGE_USER: v.string().notEmpty(),
  WALLET_STORAGE_PASSWORD: v.string().notEmpty(),

  CRYPTO_PRIVATE_KEY: v.string().notEmpty(),
  PLATFORM_URL: v.string().url(),
  PLATFORM_PROFILE_MODE: v.string().notEmpty(),

  PUBLIC_LOCALHOST_URL: v.string().startsWith('http://localhost'), // tiene que ser localhost sí o sí
  PUBLIC_DEV_API_URL: v.string().url(), //en el env tienen una forma específica
  PUBLIC_QA_API_URL: v.string().url(), //en el env tienen una forma específica
  PUBLIC_PRODUCTION_API_URL: v.string().url(), //en el env tienen una forma específica
  PUBLIC_SANDBOX_API_URL: v.string().url(), //en el env tienen una forma específica
  PUBLIC_PLATFORM_SUPPORT_EMAIL: v.string().email(),

  AFJ_VERSION: v.string().notEmpty(), // también tiene una forma concreta

  PLATFORM_WALLET_NAME: v.string().notEmpty(),
  PLATFORM_WALLET_PASSWORD: v.string().notEmpty(),
  PLATFORM_SEED: v.string().notEmpty(),
  PLATFORM_ID: v.string().number(),

  // POOL_DATABASE_URL: v.string().postgresUrl(), // postgres
  // DATABASE_URL: v.string().posgresUrl(),

  AWS_ACCESS_KEY: v.string().notEmpty(),
  AWS_SECRET_KEY: v.string().notEmpty(),
  AWS_REGION: v.string().notEmpty(),
  AWS_BUCKET: v.string().notEmpty(),

  AWS_PUBLIC_ACCESS_KEY: v.string().notEmpty(),
  AWS_PUBLIC_SECRET_KEY: v.string().notEmpty(),
  AWS_PUBLIC_REGION: v.string().notEmpty(),
  AWS_ORG_LOGO_BUCKET_NAME: v.string().notEmpty(),

  AWS_S3_STOREOBJECT_ACCESS_KEY: v.string().notEmpty(),
  AWS_S3_STOREOBJECT_SECRET_KEY: v.string().notEmpty(),
  AWS_S3_STOREOBJECT_REGION: v.string().notEmpty(),
  AWS_S3_STOREOBJECT_BUCKET: v.string().notEmpty(),

  SHORTENED_URL_DOMAIN: v.string().url(), // tiene una forma concret
  DEEPLINK_DOMAIN: v.string().notEmpty(), //tiene una forma concret

  // ENABLE_CORS_IP_LIST: v.string().multipleUrl(),

  USER_NKEY_SEED: v.string().notEmpty(),
  API_GATEWAY_NKEY_SEED: v.string().notEmpty(),
  ORGANIZATION_NKEY_SEED: v.string().notEmpty(),
  AGENT_PROVISIONING_NKEY_SEED: v.string().notEmpty(),
  AGENT_SERVICE_NKEY_SEED: v.string().notEmpty(),
  VERIFICATION_NKEY_SEED: v.string().notEmpty(),
  LEDGER_NKEY_SEED: v.string().notEmpty(),
  ISSUANCE_NKEY_SEED: v.string().notEmpty(),
  CONNECTION_NKEY_SEED: v.string().notEmpty(),
  ECOSYSTEM_NKEY_SEED: v.string().notEmpty(),
  CREDENTAILDEFINITION_NKEY_SEED: v.string().notEmpty(),
  SCHEMA_NKEY_SEED: v.string().notEmpty(),
  UTILITIES_NKEY_SEED: v.string().notEmpty(),
  CLOUD_WALLET_NKEY_SEED: v.string().notEmpty(),
  GEOLOCATION_NKEY_SEED: v.string().notEmpty(),
  NOTIFICATION_NKEY_SEED: v.string().notEmpty(),

  // KEYCLOAK_DOMAIN: v.string().domain(),
  KEYCLOAK_ADMIN_URL: v.string().url(),
  KEYCLOAK_MASTER_REALM: v.string().notEmpty(),
  KEYCLOAK_MANAGEMENT_CLIENT_ID: v.string().notEmpty(),
  KEYCLOAK_MANAGEMENT_CLIENT_SECRET: v.string().notEmpty(),
  KEYCLOAK_REALM: v.string().notEmpty(),

  SCHEMA_FILE_SERVER_URL: v.string().notEmpty(), // tiene una forma concreta
  SCHEMA_FILE_SERVER_TOKEN: v.string().notEmpty(),

  // GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT: v.string().location(),
  // UPDATE_CLIENT_CREDENTIAL_SCRIPT: v.string().location(),

  // AFJ_AGENT_TOKEN_PATH: v.string().existsLocation(),
  // AFJ_AGENT_SPIN_UP: v.string().existsLocation(),
  // AFJ_AGENT_ENDPOINT_PATH: v.string().existsLocation(),

  // AFJ_AGENT_TOKEN_PATH: v.string().location(),
  // AFJ_AGENT_SPIN_UP: v.string().location(),
  // AFJ_AGENT_ENDPOINT_PATH: v.string().location(),

  AGENT_PROTOCOL: v.string().protocol(),
  OOB_BATCH_SIZE: v.string().number(),
  PROOF_REQ_CONN_LIMIT: v.string().number(),
  MAX_ORG_LIMIT: v.string().number(),
  FIDO_API_ENDPOINT: v.string().endpoint(),

  IS_ECOSYSTEM_ENABLE: v.string().boolean(),
  CONSOLE_LOG_FLAG: v.string().boolean(),
  ELK_LOG: v.string().boolean(),
  LOG_LEVEL: v.string().notEmpty(),
  ELK_LOG_PATH: v.string().url(),
  ELK_USERNAME: v.string().notEmpty(),
  ELK_PASSWORD: v.string().notEmpty(),

  ORGANIZATION: v.string().notEmpty(),
  CONTEXT: v.string().notEmpty(),
  APP: v.string().notEmpty()
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw parsed.error.flatten();
}

export const env = parsed.data;

// console.log('SUCCESS:', parsed.data);

// export const env = parsed.data;

// console.log(env);

// const mySchema = new ConfigSchema({
//   API_GATEWAY_PROTOCOL: v.protocol(),
//   API_GATEWAY_HOST: v.host,
//   API_GATEWAY_PORT: v.port,
//   API_GATEWAY_PROTOCOL_SECURE: v.protocol,
//   API_ENDPOINT: v.endpoint,

//   FRONT_END_URL: v.url,

//   MOBILE_APP: v.notEmpty,
//   MOBILE_APP_NAME: v.notEmpty,
//   MOBILE_APP_DOWNLOAD_URL: v.url,
//   PLAY_STORE_DOWNLOAD_LINK: v.url, // tiene forma concreta
//   IOS_DOWNLOAD_LINK: v.url, // tiene forma concreta

//   PLATFORM_NAME: v.notEmpty,
//   POWERED_BY: v.notEmpty,
//   PLATFORM_WEB_URL: v.url,
//   POWERED_BY_URL: v.url,
//   UPLOAD_LOGO_HOST: v.host,
//   BRAND_LOGO: v.url,
//   PLATFORM_ADMIN_EMAIL: v.email,

//   SOCKET_HOST: v.host,

//   NATS_HOST: v.host,
//   NATS_PORT: v.port,
//   NATS_URL: v.url,

//   REDIS_HOST: v.host,
//   REDIS_PORT: v.port,

//   WALLET_STORAGE_HOST: v.host,
//   WALLET_STORAGE_PORT: v.port,
//   WALLET_STORAGE_USER: v.notEmpty,
//   WALLET_STORAGE_PASSWORD: v.notEmpty,

//   CRYPTO_PRIVATE_KEY: v.notEmpty,
//   PLATFORM_URL: v.url, // debe tener la forma https://devapi.credebl.id
//   PLATFORM_PROFILE_MODE: v.notEmpty,

//   PUBLIC_LOCALHOST_URL: v.url, // tiene que ser localhost sí o sí
//   PUBLIC_DEV_API_URL: v.url, //en el env tienen una forma específica
//   PUBLIC_QA_API_URL: v.url, //en el env tienen una forma específica
//   PUBLIC_PRODUCTION_API_URL: v.url, //en el env tienen una forma específica
//   PUBLIC_SANDBOX_API_URL: v.url, //en el env tienen una forma específica
//   PUBLIC_PLATFORM_SUPPORT_EMAIL: v.email,

//   AFJ_VERSION: v.notEmpty, // también tiene una forma concreta

//   PLATFORM_WALLET_NAME: v.notEmpty,
//   PLATFORM_WALLET_PASSWORD: v.notEmpty,
//   PLATFORM_SEED: v.notEmpty,
//   PLATFORM_ID: v.number,

//   POOL_DATABASE_URL: v.postgresUrl, // postgres
//   DATABASE_URL: v.posgresUrl,

//   AWS_ACCESS_KEY: v.notEmpty,
//   AWS_SECRET_KEY: v.notEmpty,
//   AWS_REGION: v.notEmpty,
//   AWS_BUCKET: v.notEmpty,

//   AWS_PUBLIC_ACCESS_KEY: v.notEmpty,
//   AWS_PUBLIC_SECRET_KEY: v.notEmpty,
//   AWS_PUBLIC_REGION: v.notEmpty,
//   AWS_ORG_LOGO_BUCKET_NAME: v.notEmpty,

//   AWS_S3_STOREOBJECT_ACCESS_KEY: v.notEmpty,
//   AWS_S3_STOREOBJECT_SECRET_KEY: v.notEmpty,
//   AWS_S3_STOREOBJECT_REGION: v.notEmpty,
//   AWS_S3_STOREOBJECT_BUCKET: v.notEmpty,

//   SHORTENED_URL_DOMAIN: v.url, // tiene una forma concret
//   DEEPLINK_DOMAIN: v.notEmpty, //tiene una forma concret

//   ENABLE_CORS_IP_LIST: v.multipleUrl,

//   USER_NKEY_SEED: v.notEmpty,
//   API_GATEWAY_NKEY_SEED: v.notEmpty,
//   ORGANIZATION_NKEY_SEED: v.notEmpty,
//   AGENT_PROVISIONING_NKEY_SEED: v.notEmpty,
//   AGENT_SERVICE_NKEY_SEED: v.notEmpty,
//   VERIFICATION_NKEY_SEED: v.notEmpty,
//   LEDGER_NKEY_SEED: v.notEmpty,
//   ISSUANCE_NKEY_SEED: v.notEmpty,
//   CONNECTION_NKEY_SEED: v.notEmpty,
//   ECOSYSTEM_NKEY_SEED: v.notEmpty,
//   CREDENTAILDEFINITION_NKEY_SEED: v.notEmpty,
//   SCHEMA_NKEY_SEED: v.notEmpty,
//   UTILITIES_NKEY_SEED: v.notEmpty,
//   CLOUD_WALLET_NKEY_SEED: v.notEmpty,
//   GEOLOCATION_NKEY_SEED: v.notEmpty,
//   NOTIFICATION_NKEY_SEED: v.notEmpty,

//   KEYCLOAK_DOMAIN: v.domain,
//   KEYCLOAK_ADMIN_URL: v.url,
//   KEYCLOAK_MASTER_REALM: v.notEmpty,
//   KEYCLOAK_MANAGEMENT_CLIENT_ID: v.notEmpty,
//   KEYCLOAK_MANAGEMENT_CLIENT_SECRET: v.notEmpty,
//   KEYCLOAK_REALM: v.notEmpty,

//   SCHEMA_FILE_SERVER_URL: v.notEmpty, // tiene una forma concreta
//   SCHEMA_FILE_SERVER_TOKEN: v.notEmpty,

//   GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT: v.location,
//   UPDATE_CLIENT_CREDENTIAL_SCRIPT: v.location,

//   AFJ_AGENT_TOKEN_PATH: v.existsLocation,
//   AFJ_AGENT_SPIN_UP: v.existsLocation,
//   AFJ_AGENT_ENDPOINT_PATH: v.existsLocation,

//   AFJ_AGENT_TOKEN_PATH: v.location,
//   AFJ_AGENT_SPIN_UP: v.location,
//   AFJ_AGENT_ENDPOINT_PATH: v.location,

//   AGENT_PROTOCOL: v.protocol,
//   OOB_BATCH_SIZE: v.number,
//   PROOF_REQ_CONN_LIMIT: v.number,
//   MAX_ORG_LIMIT: v.number,
//   FIDO_API_ENDPOINT: v.endpoint,

//   IS_ECOSYSTEM_ENABLE: v.boolean,
//   CONSOLE_LOG_FLAG: v.boolean,
//   ELK_LOG: v.boolean,
//   LOG_LEVEL: v.notEmpty,
//   ELK_LOG_PATH: v.url,
//   ELK_USERNAME: v.notEmpty,
//   ELK_PASSWORD: v.notEmpty,

//   ORGANIZATION: v.notEmpty,
//   CONTEXT: v.notEmpty,
//   APP: v.notEmpty
// });
