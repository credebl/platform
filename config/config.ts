import { ConfigSchema } from './env-validation';

import { Validator } from './Validator';

// --------------------------------------------------------------------------------

const v = new Validator();

const mySchema = new ConfigSchema({
  API_GATEWAY_PROTOCOL: { method: v.protocol },
  API_GATEWAY_HOST: { method: v.host },
  API_GATEWAY_PORT: { method: v.port },
  API_GATEWAY_PROTOCOL_SECURE: { method: v.protocol },
  API_ENDPOINT: { method: v.endpoint },

  FRONT_END_URL: { method: v.url },

  MOBILE_APP: { method: v.notEmpty },
  MOBILE_APP_NAME: { method: v.notEmpty },
  MOBILE_APP_DOWNLOAD_URL: { method: v.url },
  PLAY_STORE_DOWNLOAD_LINK: { method: v.url }, // tiene forma concret}a
  IOS_DOWNLOAD_LINK: { method: v.url }, // tiene forma concret}a

  PLATFORM_NAME: { method: v.notEmpty },
  POWERED_BY: { method: v.notEmpty },
  PLATFORM_WEB_URL: { method: v.url },
  POWERED_BY_URL: { method: v.url },
  UPLOAD_LOGO_HOST: { method: v.host },
  BRAND_LOGO: { method: v.url },
  PLATFORM_ADMIN_EMAIL: { method: v.email },

  SOCKET_HOST: { method: v.host },

  NATS_HOST: { method: v.host },
  NATS_PORT: { method: v.port },
  NATS_URL: { method: v.url },

  REDIS_HOST: { method: v.host },
  REDIS_PORT: { method: v.port },

  WALLET_STORAGE_HOST: { method: v.host },
  WALLET_STORAGE_PORT: { method: v.port },
  WALLET_STORAGE_USER: { method: v.notEmpty },
  WALLET_STORAGE_PASSWORD: { method: v.notEmpty },

  CRYPTO_PRIVATE_KEY: { method: v.notEmpty },
  PLATFORM_URL: { method: v.url }, // debe tener la forma https://devapi.credebl.i}d
  PLATFORM_PROFILE_MODE: { method: v.notEmpty },

  PUBLIC_LOCALHOST_URL: { method: v.url }, // tiene que ser localhost sí o s}í
  PUBLIC_DEV_API_URL: { method: v.url }, //en el env tienen una forma específic}a
  PUBLIC_QA_API_URL: { method: v.url }, //en el env tienen una forma específic}a
  PUBLIC_PRODUCTION_API_URL: { method: v.url }, //en el env tienen una forma específic}a
  PUBLIC_SANDBOX_API_URL: { method: v.url }, //en el env tienen una forma específic}a
  PUBLIC_PLATFORM_SUPPORT_EMAIL: { method: v.email },

  AFJ_VERSION: { method: v.notEmpty }, // también tiene una forma concret}a

  PLATFORM_WALLET_NAME: { method: v.notEmpty },
  PLATFORM_WALLET_PASSWORD: { method: v.notEmpty },
  PLATFORM_SEED: { method: v.notEmpty },
  PLATFORM_ID: { method: v.number },

  POOL_DATABASE_URL: { method: v.postgresUrl }, // postgre}s
  DATABASE_URL: { method: v.posgresUrl },

  AWS_ACCESS_KEY: { method: v.notEmpty, optional: true },
  AWS_SECRET_KEY: { method: v.notEmpty, optional: true },
  AWS_REGION: { method: v.notEmpty, optional: true },
  AWS_BUCKET: { method: v.notEmpty, optional: true },

  AWS_PUBLIC_ACCESS_KEY: { method: v.notEmpty, optional: true },
  AWS_PUBLIC_SECRET_KEY: { method: v.notEmpty, optional: true },
  AWS_PUBLIC_REGION: { method: v.notEmpty, optional: true },
  AWS_ORG_LOGO_BUCKET_NAME: { method: v.notEmpty, optional: true },

  AWS_S3_STOREOBJECT_ACCESS_KEY: { method: v.notEmpty },
  AWS_S3_STOREOBJECT_SECRET_KEY: { method: v.notEmpty },
  AWS_S3_STOREOBJECT_REGION: { method: v.notEmpty },
  AWS_S3_STOREOBJECT_BUCKET: { method: v.notEmpty },

  SHORTENED_URL_DOMAIN: { method: v.url }, // tiene una forma concret}
  DEEPLINK_DOMAIN: { method: v.notEmpty }, //tiene una forma concret}

  ENABLE_CORS_IP_LIST: { method: v.multipleUrl },

  USER_NKEY_SEED: { method: v.notEmpty },
  API_GATEWAY_NKEY_SEED: { method: v.notEmpty },
  ORGANIZATION_NKEY_SEED: { method: v.notEmpty },
  AGENT_PROVISIONING_NKEY_SEED: { method: v.notEmpty },
  AGENT_SERVICE_NKEY_SEED: { method: v.notEmpty },
  VERIFICATION_NKEY_SEED: { method: v.notEmpty },
  LEDGER_NKEY_SEED: { method: v.notEmpty },
  ISSUANCE_NKEY_SEED: { method: v.notEmpty },
  CONNECTION_NKEY_SEED: { method: v.notEmpty },
  ECOSYSTEM_NKEY_SEED: { method: v.notEmpty },
  CREDENTAILDEFINITION_NKEY_SEED: { method: v.notEmpty },
  SCHEMA_NKEY_SEED: { method: v.notEmpty },
  UTILITIES_NKEY_SEED: { method: v.notEmpty },
  CLOUD_WALLET_NKEY_SEED: { method: v.notEmpty },
  GEOLOCATION_NKEY_SEED: { method: v.notEmpty },
  NOTIFICATION_NKEY_SEED: { method: v.notEmpty },

  KEYCLOAK_DOMAIN: { method: v.domain },
  KEYCLOAK_ADMIN_URL: { method: v.url },
  KEYCLOAK_MASTER_REALM: { method: v.notEmpty },
  KEYCLOAK_MANAGEMENT_CLIENT_ID: { method: v.notEmpty },
  KEYCLOAK_MANAGEMENT_CLIENT_SECRET: { method: v.notEmpty },
  KEYCLOAK_REALM: { method: v.notEmpty },

  SCHEMA_FILE_SERVER_URL: { method: v.notEmpty }, // tiene una forma concret}a
  SCHEMA_FILE_SERVER_TOKEN: { method: v.notEmpty },

  GEO_LOCATION_MASTER_DATA_IMPORT_SCRIPT: { method: v.location },
  UPDATE_CLIENT_CREDENTIAL_SCRIPT: { method: v.location },

  AFJ_AGENT_TOKEN_PATH: { method: v.existsLocation },
  AFJ_AGENT_SPIN_UP: { method: v.existsLocation },
  AFJ_AGENT_ENDPOINT_PATH: { method: v.existsLocation },

  AFJ_AGENT_TOKEN_PATH: { method: v.location, optional: true },
  AFJ_AGENT_SPIN_UP: { method: v.location, optional: true },
  AFJ_AGENT_ENDPOINT_PATH: { method: v.location, optional: true },

  AGENT_PROTOCOL: { method: v.protocol },
  OOB_BATCH_SIZE: { method: v.number },
  PROOF_REQ_CONN_LIMIT: { method: v.number },
  MAX_ORG_LIMIT: { method: v.number },
  FIDO_API_ENDPOINT: { method: v.endpoint },

  IS_ECOSYSTEM_ENABLE: { method: v.boolean },
  CONSOLE_LOG_FLAG: { method: v.boolean },
  ELK_LOG: { method: v.boolean },
  LOG_LEVEL: { method: v.notEmpty },
  ELK_LOG_PATH: { method: v.url },
  ELK_USERNAME: { method: v.notEmpty },
  ELK_PASSWORD: { method: v.notEmpty },

  ORGANIZATION: { method: v.notEmpty },
  CONTEXT: { method: v.notEmpty },
  APP: { method: v.notEmpty }
});

const { errors, success, data } = mySchema.safeParse();

if (!success) {
  throw errors;
}

export const { API_GATEWAY_PROTOCOL, API_GATEWAY_PORT } = data;
