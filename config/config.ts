import { v } from './core';

const envDemoSchema = v.schema({
  // API_GATEWAY
  API_GATEWAY_PROTOCOL: v.str().protocol(),
  API_GATEWAY_HOST: v.str().host(),
  API_GATEWAY_PORT: v.str().port(),
  API_GATEWAY_PROTOCOL_SECURE: v.str().protocol(),
  API_ENDPOINT: v.str().endpoint(),

  // FRONT_END_URL
  FRONT_END_URL: v.str().url(),

  // MOBILE_APP
  MOBILE_APP: v.str().notEmpty(),
  MOBILE_APP_NAME: v.str().notEmpty(),
  MOBILE_APP_DOWNLOAD_URL: v.str().url(),
  PLAY_STORE_DOWNLOAD_LINK: v.str().url(),
  IOS_DOWNLOAD_LINK: v.str().url(),

  // PLATFORM
  PLATFORM_NAME: v.str().notEmpty(),
  POWERED_BY: v.str().notEmpty(),
  PLATFORM_WEB_URL: v.str().url(),
  POWERED_BY_URL: v.str().url(),
  UPLOAD_LOGO_HOST: v.str().host(),
  BRAND_LOGO: v.str().url(),
  PLATFORM_ADMIN_EMAIL: v.str().email(),

  // SOCKET
  SOCKET_HOST: v.str().url(),

  // NATS
  NATS_HOST: v.str().host(),
  NATS_PORT: v.str().port(),
  NATS_URL: v.str().url(),

  // REDIS
  REDIS_HOST: v.str().host(),
  REDIS_PORT: v.str().port(),

  // SENDGRID
  SENDGRID_API_KEY: v.str().optional(),

  // WALLET_STORAGE
  WALLET_STORAGE_HOST: v.str().host(),
  WALLET_STORAGE_PORT: v.str().port(),
  WALLET_STORAGE_USER: v.str().notEmpty(),
  WALLET_STORAGE_PASSWORD: v.str().notEmpty(),

  // CRYPTO
  CRYPTO_PRIVATE_KEY: v.str().notEmpty(),
  PLATFORM_URL: v.str().url(),
  PLATFORM_PROFILE_MODE: v.str().notEmpty(),

  // PUBLIC_URL
  PUBLIC_LOCALHOST_URL: v.str().localhost(),
  PUBLIC_DEV_API_URL: v.str().url(),
  PUBLIC_QA_API_URL: v.str().url(),
  PUBLIC_PRODUCTION_API_URL: v.str().url(),
  PUBLIC_SANDBOX_API_URL: v.str().url(),
  PUBLIC_PLATFORM_SUPPORT_EMAIL: v.str().email(),

  // AFJ
  AFJ_VERSION: v.str().notEmpty(),

  // PLATFORM_WALLET
  PLATFORM_WALLET_NAME: v.str().notEmpty(),
  PLATFORM_WALLET_PASSWORD: v.str().notEmpty(),
  PLATFORM_SEED: v.str().notEmpty(),
  PLATFORM_ID: v.str().number(),

  // DATABASE
  POOL_DATABASE_URL: v.str().postgresUrl(),
  DATABASE_URL: v.str().postgresUrl(),

  // AWS (optional)
  AWS_ACCESS_KEY: v.str().optional(),
  AWS_SECRET_KEY: v.str().optional(),
  AWS_REGION: v.str().optional(),
  AWS_BUCKET: v.str().optional(),

  // AWS_PUBLIC (optional)
  AWS_PUBLIC_ACCESS_KEY: v.str().optional(),
  AWS_PUBLIC_SECRET_KEY: v.str().optional(),
  AWS_PUBLIC_REGION: v.str().optional(),
  AWS_ORG_LOGO_BUCKET_NAME: v.str().optional(),

  // AWS_S3_STOREOBJECT (optional)
  AWS_S3_STOREOBJECT_ACCESS_KEY: v.str().optional(),
  AWS_S3_STOREOBJECT_SECRET_KEY: v.str().optional(),
  AWS_S3_STOREOBJECT_REGION: v.str().optional(),
  AWS_S3_STOREOBJECT_BUCKET: v.str().optional(),

  SHORTENED_URL_DOMAIN: v.str().url(),
  DEEPLINK_DOMAIN: v.str().url(),

  ENABLE_CORS_IP_LIST: v.str().multipleUrl(),

  // SEEDS
  USER_NKEY_SEED: v.str().notEmpty(),
  API_GATEWAY_NKEY_SEED: v.str().notEmpty(),
  ORGANIZATION_NKEY_SEED: v.str().notEmpty(),
  AGENT_PROVISIONING_NKEY_SEED: v.str().notEmpty(),
  AGENT_SERVICE_NKEY_SEED: v.str().notEmpty(),
  VERIFICATION_NKEY_SEED: v.str().notEmpty(),
  LEDGER_NKEY_SEED: v.str().notEmpty(),
  ISSUANCE_NKEY_SEED: v.str().notEmpty(),
  CONNECTION_NKEY_SEED: v.str().notEmpty(),
  ECOSYSTEM_NKEY_SEED: v.str().notEmpty(),
  CREDENTAILDEFINITION_NKEY_SEED: v.str().notEmpty(),
  SCHEMA_NKEY_SEED: v.str().notEmpty(),
  UTILITIES_NKEY_SEED: v.str().notEmpty(),
  CLOUD_WALLET_NKEY_SEED: v.str().notEmpty(),
  GEOLOCATION_NKEY_SEED: v.str().notEmpty(),
  NOTIFICATION_NKEY_SEED: v.str().notEmpty(),

  // KEYCLOAK
  KEYCLOAK_DOMAIN: v.str().url(),
  KEYCLOAK_ADMIN_URL: v.str().url(),
  KEYCLOAK_MASTER_REALM: v.str().notEmpty(),
  KEYCLOAK_MANAGEMENT_CLIENT_ID: v.str().notEmpty(),
  KEYCLOAK_MANAGEMENT_CLIENT_SECRET: v.str().optional(),
  KEYCLOAK_REALM: v.str().notEmpty(),

  // SCHEMA_FILE_SERVER
  SCHEMA_FILE_SERVER_URL: v.str().url(),
  SCHEMA_FILE_SERVER_TOKEN: v.str().optional(),

  // SCRIPTS
  GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT: v.str().notEmpty(),
  UPDATE_CLIENT_CREDENTIAL_SCRIPT: v.str().notEmpty(),

  // AFJ_AGENT IN CASE OF DOCKER
  AFJ_AGENT_TOKEN_PATH: v.str().optional(),
  AFJ_AGENT_SPIN_UP: v.str().optional(),
  AFJ_AGENT_ENDPOINT_PATH: v.str().optional(),

  // AGENT_PROTOCOL
  AGENT_PROTOCOL: v.str().protocol(),
  OOB_BATCH_SIZE: v.str().number(),
  PROOF_REQ_CONN_LIMIT: v.str().number(),
  MAX_ORG_LIMIT: v.str().number(),
  FIDO_API_ENDPOINT: v.str().url(),

  // LOGGING
  IS_ECOSYSTEM_ENABLE: v.str().boolean(),
  CONSOLE_LOG_FLAG: v.str().boolean(),
  ELK_LOG: v.str().boolean(),
  LOG_LEVEL: v.str().notEmpty(),
  ELK_LOG_PATH: v.str().url(),
  ELK_USERNAME: v.str().notEmpty(),
  ELK_PASSWORD: v.str().notEmpty(),

  // ORGANIZATION
  ORGANIZATION: v.str().notEmpty(),
  CONTEXT: v.str().notEmpty(),
  APP: v.str().notEmpty()
});

const parsedEnv = envDemoSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw parsedEnv.error.flatten();
}

const { data } = parsedEnv;

export { data };
