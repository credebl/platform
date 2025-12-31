export enum CommonConstants {
  // Error and Success Responses from POST and GET calls
  RESP_ERR_HTTP_INVALID_HEADER_VALUE = 'ERR_HTTP_INVALID_HEADER_VALUE',
  RESP_ERR_HTTP_ECONNREFUSED = 'ECONNREFUSED',
  RESP_ERR_401 = 401,
  RESP_ERR_NOT_FOUND = 404,
  RESP_BAD_REQUEST = 400,
  RESP_ERR_UNPROCESSABLE_ENTITY = 422,
  RESP_SUCCESS_200 = 200,
  RESP_SUCCESS_201 = 201,
  RESP_SUCCESS_204 = 204,
  RESP_ERR_500 = 500,
  UNAUTH_MSG = 'UNAUTHORISED ACCESS',
  DATA_ALREADY_PRESENT = 'RECORD ALREADY EXIST',
  RESP_CONFLICT = 409,
  // URL constants for various GET/POST calls
  // CONNECTION SERVICES
  URL_CONN_GET_CONNECTIONS = '/didcomm/connections',
  URL_CONN_GET_CONNECTION_BY_ID = '/didcomm/connections/#',
  URL_CONN_CREATE_CONNECTION_INVITE = '/connections/create-invitation',
  URL_CONN_RECEIVE_CONNECTION_INVITE = '/connections/receive-invitation',
  URL_CONN_ACCEPT_CONNECTION_INVITE = '/connections/#/accept-invitation',
  URL_CONN_ACCEPT_CONNECTION_REQUEST = '/connections/#/accept-request',
  URL_CONN_REMOVE_CONNECTION_BY_ID = '/connections/#/remove',
  URL_CONN_METADATA = '/connections/#/metadata',
  URL_CONN_LEGACY_INVITE = '/didcomm/oob/create-legacy-invitation',
  URL_CONN_INVITE = '/didcomm/oob/create-invitation',
  URL_RECEIVE_INVITATION_URL = '/didcomm/oob/receive-invitation-url',
  URL_RECEIVE_INVITATION = '/didcomm/oob/receive-invitation',
  URL_CONN_INVITATION = '/url',
  URL_AGENT_TOKEN = '/agent/token',
  URL_SHARED_WALLET_TOKEN = '/multi-tenancy/get-token/',

  // WALLET SERVICES
  URL_WALLET_CREATE_DID = '/wallet/did/create',
  URL_WALLET_LIST_DID = '/wallet/did',
  URL_WALLET_FETCH_OR_ASSIGN_CURR_PUB_DID = '/wallet/did/public',
  URL_WALLET_GET_OR_SET_TAGGING_POLICY = '/wallet/tag-policy/#',
  URL_WALLET_PROVISION = '/wallet/provision',

  // LEDGER SERVICES
  URL_LEDG_GET_DID_VERKEY = '/ledger/did-verkey?did=#',
  URL_LEDG_REGISTER_NYM = '/ledger/register-nym?did=#&verkey=@&role=$',
  URL_LEDG_GET_DID_ENDPOINT = '/ledger/did-endpoint?did=#',
  URL_LEDG_GET_TAA = '/ledger/taa',
  URL_LEDG_POST_TAA_ACCEPT = '/ledger/taa/accept',

  //W3cSCHEMA
  W3C_SCHEMA_URL = 'https://www.w3.org/2018/credentials/v1',

  // MESSAGING SERVICES
  URL_MSG_SEND_MESSAGE = '/connections/#/send-message',
  URL_MSG_TRUST_PING = '/connections/#/send-ping',
  URL_MSG_BY_CONN = '/basic-message/#',

  // CREDENTIAL ISSUANCE SERVICES
  URL_ISSUE_GET_CREDS = '/credentials',
  URL_ISSUE_GET_CREDEX_RECS = '/issue-credential/records',
  URL_ISSUE_GET_CRED_REC_BY_ID = '/credentials/#',
  URL_ISSUE_SEND_CRED = '/credentials/offer-credential',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  URL_ISSUE_SEND_CRED_OFFER = '/credentials/offer-credential',
  URL_ISSUE_CREATE_SEND_PROPOSAL = '/issue-credential/send-proposal',
  URL_ISSUE_CREATE_CRED_OFFER = '/issue-credential/send-offer',
  URL_ISSUE_CREAT_CRED_OFFER_BY_CRED_ID = '/credentials/#/accept-proposal',
  URL_ISSUE_CREATE_CRED_REQUEST = '/issue-credential/records/#/send-request',
  URL_ISSUE_SEND_ISSUED_CRED = '/issue-credential/records/#/issue',
  URL_ISSUE_STORE_CRED = '/issue-credential/records/#/store',
  URL_ISSUE_REPORT_PROB_CREDEX = '/issue-credential/records/#/problem-report',
  URL_ISSUE_REMOVE_CRED = '/issue-credential/records/#/remove',
  URL_ISSUE_REVOKE_CRED = '/revocation/revoke',
  URL_PUBLISH_REVOCATION = '/issue-credential/publish-revocations',
  URL_CREATE_ISSUE_CREDENTIAL_OUT_OF_BAND = '/issue-credential/create',
  URL_CREATE_OUT_OF_BAND_INVITATION = '/out-of-band/create-invitation',
  URL_ISSUANCE_CREATE_OFFER = '/didcomm/credentials/create-offer',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  URL_ISSUE_GET_CREDS_AFJ = '/credentials',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  URL_ISSUE_GET_CREDS_BY_CRED_REC_ID = '/didcomm/credentials/#',
  URL_OUT_OF_BAND_CREDENTIAL_OFFER = '/didcomm/credentials/create-offer-oob',
  URL_ACCEPT_CREDENTIALS = '/credentials/accept-offer',
  URL_SEND_QUESTION = '/didcomm/question-answer/question/#',
  URL_QUESTION_ANSWER_RECORD = '/didcomm/question-answer',
  URL_SEND_BASIC_MESSAGE = '/didcomm/basic-messages/#',

  // SCHEMA & CRED DEF SERVICES
  URL_SCHM_CREATE_SCHEMA = '/anoncreds/schemas',
  URL_SCHM_GET_SCHEMA_BY_ID = '/anoncreds/schemas/#',
  URL_SCHM_CREATE_CRED_DEF = '/anoncreds/credential-definitions',
  URL_SCHM_GET_CRED_DEF_BY_ID = '/anoncreds/credential-definitions/#',

  // POLYGON BASED W3C SCHEMAS
  CREATE_POLYGON_W3C_SCHEMA = '/polygon/create-schema',

  // SHARED AGENT
  URL_SHAGENT_CREATE_TENANT = '/multi-tenancy/create-tenant',
  URL_SHAGENT_DELETE_SUB_WALLET = '/multi-tenancy/#',

  // PROOF SERVICES
  URL_SEND_PROOF_REQUEST = '/didcomm/proofs/request-proof',
  URL_GET_PROOF_PRESENTATIONS = '/proofs',
  URL_GET_PROOF_PRESENTATION_BY_ID = '/didcomm/proofs/#',
  URL_ACCEPT_PRESENTATION = '/didcomm/proofs/#/accept-presentation',
  URL_CREATE_OUT_OF_BAND_CREATE_REQUEST = '/didcomm/proofs/create-request-oob',
  URL_PROOF_FORM_DATA = '/didcomm/proofs/#/form-data',

  // server or agent
  URL_SERVER_STATUS = '/status',
  URL_AGENT_WRITE_DID = '/dids/write',
  URL_AGENT_GET_DID = '/dids',
  URL_AGENT_GET_ENDPOINT = '/agent',

  // sign data from agent
  URL_AGENT_SIGN_DATA = '/agent/credential/sign',
  URL_AGENT_VERIFY_SIGNED_DATA = '/agent/credential/verify',

  // CREATE KEYS
  CREATE_POLYGON_SECP256k1_KEY = '/polygon/create-keys',

  // OID4VC URLs
  URL_OIDC_ISSUER_CREATE = '/openid4vc/issuer',
  /* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase, @typescript-eslint/no-duplicate-enum-values */
  URL_OIDC_GET_ISSUERS = '/openid4vc/issuer',
  URL_OIDC_ISSUER_UPDATE = '/openid4vc/issuer/#',
  URL_OIDC_ISSUER_SESSIONS_CREATE = '/openid4vc/issuance-sessions/create-credential-offer',
  URL_OIDC_ISSUER_SESSIONS_GET = '/openid4vc/issuance-sessions/#',
  URL_OIDC_ISSUER_SESSIONS_GET_ALL = '/openid4vc/issuance-sessions',

  // OID4Vp URLs
  URL_OIDC_VERIFIER_CREATE = '/openid4vc/verifier', //TODO: correct this URL
  URL_OIDC_VERIFIER_UPDATE = '/openid4vc/verifier/#',
  URL_OIDC_VERIFIER_DELETE = '/openid4vc/verifier/#',
  URL_OIDC_VERIFIER_GET = '/openid4vc/verifier/#',
  URL_OIDC_VERIFIER_SESSION_GET_BY_ID = '/openid4vc/verification-sessions/#',
  URL_OIDC_VERIFIER_SESSION_GET_BY_QUERY = '/openid4vc/verification-sessions',
  URL_OIDC_VERIFIER_SESSION_RESPONSE_GET_BY_ID = '/openid4vc/verification-sessions/response/#',
  URL_OID4VP_VERIFICATION_SESSION = '/openid4vc/verification-sessions/create-presentation-request',

  //X509 agent API URLs
  URL_CREATE_X509_CERTIFICATE = '/x509',
  URL_IMPORT_X509_CERTIFICATE = '/x509/import',
  URL_DECODE_X509_CERTIFICATE = '/x509/decode',

  // Nested attribute separator
  NESTED_ATTRIBUTE_SEPARATOR = '~',

  // ENTITY NAMES
  ENTITY_NAME_TEMPLATE = 'templates',
  ENTITY_NAME_CRED_DEF = 'credential_definition',
  ENTITY_NAME_ISSUED_CRED = 'issue_credentials',
  ENTITY_NAME_PROOF_REQ = 'proof_request',
  ENTITY_NAME_PROOF_PRESENTED = 'presented_proof',

  // ENTITY ACTION
  ENTITY_ACTION_INSERT = 'insert',
  ENTITY_ACTION_UPDATE = 'update',
  ENTITY_ACTION_DELETE = 'delete',

  // EVENTS
  EVENT_AUDIT = 'audit_event',

  // POLYGON KEYWORDS
  POLYGON = 'polygon',

  // DOMAIN EVENTS
  DOMAIN_EVENT_SCHEMA_CREATED = 'Schema Created',
  DOMAIN_EVENT_CRED_DEF_CREATED = 'Cred-Def Created',
  DOMAIN_EVENT_CRED_ISSUED = 'Credential Issued',
  DOMAIN_EVENT_PROOF_REQ = 'Proof Requested',
  DOMAIN_EVENT_PROOF_VERIFIED = 'Proof Verified',
  DOMAIN_EVENT_CONN_SEND = 'Connection Send',
  DOMAIN_EVENT_USER_ONBOARD = 'User Onboard',
  DOMAIN_EVENT_WALLET_CREATED = 'Wallet Created',

  // (Platform) admin permissions
  PERMISSION_TENANT_MGMT = 'Tenant Management',
  PERMISSION_ROLE_MGMT = 'Role Management',
  PERMISSION_ORG_REPORTS = 'Organization Reports',
  PERMISSION_TENANT_REPORTS = 'Tenant Reports',

  // Tenant permissions
  PERMISSION_ORG_MGMT = 'Organization Management',
  PERMISSION_MODIFY_ORG = 'Modify Organizations',

  // Roles And Permissions
  PERMISSION_PLATFORM_MANAGEMENT = 'Platform Management',
  PERMISSION_USER_MANAGEMENT = 'User Management',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  PERMISSION_ROLE_MANAGEMENT = 'Role Management',

  PERMISSION_CONNECTIONS = 'Connections',

  PERMISSION_CREATE_SCHEMA = 'Create Schema',
  PERMISSION_VIEW_SCHEMA = 'View Schema',

  PERMISSION_CREATE_CRED_DEF = 'Create Credential Definition',
  PERMISSION_VIEW_CRED_DEF = 'View Credential Definition',

  PERMISSION_ISSUE_CREDENTIAL = 'Issue Credential',

  PERMISSION_REVOKE_CREDENTIAL = 'Revoke Credential',

  PERMISSION_SEND_PROOF_REQUEST = 'Send Proof Request',

  PERMISSION_VERIFY_PROOF = 'Verify Proof',

  GENERATE_PRESENTATION_PROOF_REQUEST = '/present-proof/create-request',

  ROLE_TRUST_ANCHOR = 'TRUST_ANCHOR',
  ROLE_ENDORSER = 'ENDORSER',

  CONNECTION = 'Connection',
  SCHEMA = 'Schema',
  CREDENTIAL_DEFINITION = 'Credential Definition',
  ISSUE_CREDENTIAL = 'Issue Credentials',
  REVOKE = 'Revoke',
  PROOF_REQUEST = 'Proof Request',
  VERIFY = 'Verify',

  //REVOCATION
  URL_REVOC_REG_CREATE = '/revocation/create-registry',
  URL_GET_REVOC_REG_DATA = '/revocation/registry/#/tails-file',
  URL_UPDATE_FILE = '/revocation/registry/#',
  URL_REVOC_PUBLISH = '/revocation/registry/#/publish',
  URL_REVOC_GETBY_CREDDEF = '/revocation/active-registry/#',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  URL_REVOC_REG_BYID = '/revocation/registry/#',

  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  DEFAULT_CACHE_TTL = 60000,
  DEFAULT_FIELD_UPLOAD_SIZE = 10485760,

  // SUBSCRIPTION TYPES
  SUBSCRIPTION_COMMON = 'common',
  SUBSCRIPTION_BOTH = 'both',
  SUBSCRIPTION_ISSUER = 'Issuer',
  SUBSCRIPTION_VERIFIER = 'Verifier',

  URL_KEYCLOAK_MANAGEMENT_AUDIENCE = '/api/v2/',
  URL_KEYCLOAK_MANAGEMENT_APPLICATIONS = '/api/v2/clients',
  URL_KEYCLOAK_MANAGEMENT_APPLICATIONS_SEARCH = '/api/v2/clients/{id}',
  URL_KEYCLOAK_MANAGEMENT_GRANTS = '/api/v2/client-grants',
  URL_KEYCLOAK_MANAGEMENT_ROLES = '/api/v2/roles',
  URL_KEYCLOAK_MANAGEMENT_PERMISSIONS = '/api/v2/roles/{id}/permissions',
  URL_KEYCLOAK_AUTHORIZE = '/authorize',
  URL_KEYCLOAK_TOKEN = '/oauth/token',
  URL_KEYCLOAK_USERINFO = '/userinfo',
  URL_KEYCLOAK_CLIENT_SECRET = 'admin/realms/credebl-platform/clients/{id}/client-secret',
  URL_KEYCLOAK_JWKS = '/protocol/openid-connect/certs',
  URL_KEYCLOAK_MANAGEMENT_CONNECTIONS = '/api/v2/connections',
  SET_TRANSACTION_ROLE = '/transactions/#/set-endorser-role',
  SET_TRANSACTION_INFO = '/transactions/#/set-endorser-info',
  TRANSACTION_CREATE_REQUEST = '/transactions/create-request',
  ENDORSE_TRANSACTION = '/transactions/#/endorse',
  WRITE_TRANSACTION = '/transactions/#/write',

  // delete wallet
  URL_DELETE_WALLET = '/agent/wallet',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  URL_DELETE_SHARED_WALLET = '/multi-tenancy/#',

  // agent status
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  URL_AGENT_STATUS = '/agent',

  // Tenant Status
  PENDING_STATE = 0,
  REJECT_STATE = 2,
  APPROVE_STATE = 1,

  //User roles
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  TENANT_ROLE = 2,
  SUPER_ADMIN_ROLE = 4,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  PLATFORM_ADMIN_ROLE = 1,
  ORG_ROLE = 3,

  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ORG_PLATFORM_ROLE = 1,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ORG_TENANT_ROLE = 2,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ORG_ENTITY_ROLE = 3,

  // Organizations Status
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  PENDING_ORG = 0,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  REJECT_ORG = 2,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  APPROVE_ORG = 1,

  // Organizations Status
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  PENDING_NON_ADMIN_USER = 0,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  INACTIVE_NON_ADMIN_USER = 2,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ACTIVE_NON_ADMIN_USER = 1,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ALL_NON_ADMIN_USER = 3,

  // Platform admin Details
  PLATFORM_ADMIN_EMAIL = 'platform.admin@yopmail.com',
  PLATFORM_ADMIN_ORG = 'Platform-admin',
  PLATFORM_ADMIN_ORG_ROLE = 'platform_admin',
  SENDGRID_EMAIL_PROVIDER = 'sendgrid',
  RESEND_EMAIL_PROVIDER = 'resend',
  SMTP_EMAIL_PROVIDER = 'smtp',
  USER_HOLDER_ROLE = 'holder',

  //onBoarding Type
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ONBOARDING_TYPE_ADMIN = 0,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ONBOARDING_TYPE_EXTERNAL = 1,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ONBOARDING_TYPE_INVITATION = 2,

  // Network
  TESTNET = 'testnet',
  STAGINGNET = 'stagingnet',
  BUILDERNET = 'buildernet',
  MAINNET = 'mainnet',
  LIVENET = 'livenet',

  // Features Id
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  SCHEMA_CREATION = 1,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  CREATE_CREDENTIAL_DEFINITION = 2,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  CREATION_OF_ATTRIBUTE = 3,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  CREDENTIAL_ISSUANCE = 4,
  REVOCATION_REGISTRY = 5,
  REVOCATION_UPDATE = 6,
  VERIFY_PROOF = 7,
  ENDORSER_DID = 8,
  ORGANIZATION_CREATION = 9,
  ADD_USER = 10,

  // Static values to up platform Agent
  SEED = '101111110111101100111100000Seed1',
  KEYTYPE = 'ed25519',
  METHOD = 'indy',
  NETWORK = 'bcovrin:testnet',
  ROLE = 'endorser',

  //CacheInfo
  CACHE_SHARED_APIKEY_KEY = 'dedicatedApiKey',
  CACHE_APIKEY_KEY = 'sharedApiKey',
  CACHE_TTL_SECONDS = 604800,

  CLOUD_WALLET_GET_PROOF_REQUEST = '/didcomm/proofs',
  CLOUD_WALLET_ACCEPT_PROOF_REQUEST = '/accept-request',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  CLOUD_WALLET_CONNECTION_BY_ID = '/didcomm/connections',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  RECEIVE_INVITATION_BY_URL = '/didcomm/oob/receive-invitation-url',
  CLOUD_WALLET_CREDENTIAL = '/didcomm/credentials',
  CLOUD_WALLET_BASIC_MESSAGE = '/didcomm/basic-messages/',

  // Bulk-issuance
  BATCH_SIZE = 100,
  MAX_CONCURRENT_OPERATIONS = 50,
  ISSUANCE_BATCH_SIZE = 2000,
  ISSUANCE_MAX_CONCURRENT_OPERATIONS = 1000,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ISSUANCE_BATCH_DELAY = 60000, //Intially 60000

  // MICROSERVICES NAMES
  API_GATEWAY_SERVICE = 'api-gateway',
  ORGANIZATION_SERVICE = 'organization',
  USER_SERVICE = 'user',
  AUTH_SERVICE = 'authz',
  FIDO_SERVICE = 'fido',
  UTILITY_SERVICE = 'utilitites',
  CONNECTION_SERVICE = 'connection',
  LEDGER_SERVICE = 'ledger',
  PLATFORM_SERVICE = 'platform',
  SCHEMA_SERVICE = 'schema',
  CREDENTIAL_DEFINITION_SERVICE = 'credential-definition',
  AGENT_SERVICE = 'agent-service',
  AGENT_PROVISIONING = 'agent-provisioning',
  ISSUANCE_SERVICE = 'issuance',
  VERIFICATION_SERVICE = 'verification',
  WEBHOOK_SERVICE = 'webhook',
  NOTIFICATION_SERVICE = 'notification',
  GEO_LOCATION_SERVICE = 'geo-location',
  CLOUD_WALLET_SERVICE = 'cloud-wallet',
  OIDC4VC_ISSUANCE_SERVICE = 'oid4vc-issuance',
  OIDC4VC_VERIFICATION_SERVICE = 'oid4vc-verification',
  OID4VP_VERIFICATION_SESSION = 'oid4vp-verification-session',
  X509_SERVICE = 'x509-service',

  ACCEPT_OFFER = '/didcomm/credentials/accept-offer',
  SEED_LENGTH = 32,

  //Agent URL flags
  CONNECTION_INVITATION = 'connection-invitation',
  LEGACY_INVITATION = 'legacy-invitation',
  SIGN_DATA_FROM_AGENT = 'sign-data-from-agent',
  VERIFY_SIGNED_DATA_FROM_AGENT = 'verify-signed-data-from-agent',
  CREATE_OFFER = 'create-offer',
  CREATE_OFFER_OUT_OF_BAND = 'create-offer-oob',
  GET_OFFER_BY_CRED_ID = 'get-offer-by-cred-id',
  URL_GET_PROOF_PRESENTATION_BY_ID_FLAG = 'get-proof-presentation-by-id',
  REQUEST_PROOF = 'request-proof',
  ACCEPT_PRESENTATION = 'accept-presentation',
  CREATE_OUT_OF_BAND_PROOF_PRESENTATION = 'create-request-out-of-band',
  GET_VERIFIED_PROOF = 'get-verified-proof',
  GET_QUESTION_ANSWER_RECORD = 'get-question-answer-record',
  SEND_QUESTION = 'send-question',
  SEND_BASIC_MESSAGE = 'send-basic-message',

  AFFECTED_RECORDS_THRESHOLD_PERCENTAGE_FOR_DB_ALERT = 30,

  // OID4VC
  OIDC_ISSUER_CREATE = 'create-oid4vc-issuer',
  OIDC_ISSUER_DELETE = 'delete-oid4vc-issuer',
  OIDC_GET_ALL_ISSUERS = 'get-all-oid4vc-issuers',
  OIDC_ISSUER_BY_ID = 'get-issuer-by-id',
  OIDC_ISSUER_TEMPLATE = 'create-oid4vc-template',
  OIDC_ISSUER_SESSIONS_CREDENTIAL_OFFER = 'create-oid4vc-credential-offer',
  OIDC_ISSUER_SESSIONS_UPDATE_OFFER = 'update-oid4vc-credential-offer',
  OIDC_ISSUER_SESSIONS_BY_ID = 'get-oid4vc-session-by-id',
  OIDC_ISSUER_SESSIONS = 'get-oid4vc-sessions',
  OIDC_DELETE_CREDENTIAL_OFFER = 'delete-oid4vc-credential-offer',

  // OID4VP
  OIDC_VERIFIER_CREATE = 'create-oid4vp-verifier',
  OIDC_VERIFIER_UPDATE = 'update-oid4vp-verifier',
  OIDC_VERIFIER_DELETE = 'delete-oid4vp-verifier',
  OIDC_VERIFIER_SESSION_GET_BY_ID = 'get-oid4vp-verifier-session-id',
  OIDC_VERIFIER_SESSION_GET_BY_QUERY = 'get-oid4vp-verifier-session-query',
  OIDC_VERIFIER_SESSION_RESPONSE_GET_BY_ID = 'get-oid4vp-verifier-session-response-id',

  //X509
  X509_CREATE_CERTIFICATE = 'create-x509-certificate',
  X509_IMPORT_CERTIFICATE = 'import-x509-certificate',
  X509_DECODE_CERTIFICATE = 'decode-x509-certificate'
}
export const MICRO_SERVICE_NAME = Symbol('MICRO_SERVICE_NAME');
export const ATTRIBUTE_NAME_REGEX = /\['(.*?)'\]/;

export const postgresqlErrorCodes = [];
postgresqlErrorCodes['23503'] = 'foreign_key_violation';
postgresqlErrorCodes['00000'] = 'successful_completion';
postgresqlErrorCodes['01000'] = 'warning';
postgresqlErrorCodes['0100C'] = 'dynamic_result_sets_returned';
postgresqlErrorCodes['01008'] = 'implicit_zero_bit_padding';
postgresqlErrorCodes['01003'] = 'null_value_eliminated_in_set_function';
postgresqlErrorCodes['01007'] = 'privilege_not_granted';
postgresqlErrorCodes['01006'] = 'string_data_right_truncation';
postgresqlErrorCodes['01P01'] = 'deprecated_feature';
postgresqlErrorCodes['02000'] = 'no_data';

postgresqlErrorCodes['02001'] = 'no_additional_dynamic_result_sets_returned';
postgresqlErrorCodes['03000'] = 'sql_statement_not_yet_complete';
postgresqlErrorCodes['08000'] = 'connection_exception';
postgresqlErrorCodes['08003'] = 'connection_does_not_exist';
postgresqlErrorCodes['08006'] = 'connection_failure';
postgresqlErrorCodes['08001'] = 'sqlclient_unable_to_establish_sqlconnection';
postgresqlErrorCodes['08004'] = 'sqlserver_rejected_establishment_of_sqlconnection';
postgresqlErrorCodes['08007'] = 'transaction_resolution_unknown';
postgresqlErrorCodes['08P01'] = 'protocol_violation';
postgresqlErrorCodes['09000'] = 'triggered_action_exception';
postgresqlErrorCodes['0A000'] = 'feature_not_supported';
postgresqlErrorCodes['0B000'] = 'invalid_transaction_initiation';
postgresqlErrorCodes['0F000'] = 'locator_exception';
postgresqlErrorCodes['0F001'] = 'invalid_locator_specification';
postgresqlErrorCodes['0L000'] = 'invalid_grantor';
postgresqlErrorCodes['0LP01'] = 'invalid_grant_operation';
postgresqlErrorCodes['0P000'] = 'invalid_role_specification';
postgresqlErrorCodes['0Z000'] = 'diagnostics_exception';
postgresqlErrorCodes['0Z002'] = 'stacked_diagnostics_accessed_without_active_handler';
postgresqlErrorCodes['20000'] = 'case_not_found';
postgresqlErrorCodes['21000'] = 'cardinality_violation';
postgresqlErrorCodes['22000'] = 'data_exception';
postgresqlErrorCodes['2202E'] = 'array_subscript_error';
postgresqlErrorCodes['22021'] = 'character_not_in_repertoire';
postgresqlErrorCodes['22008'] = 'datetime_field_overflow';
postgresqlErrorCodes['22012'] = 'division_by_zero';
postgresqlErrorCodes['22005'] = 'error_in_assignment';
postgresqlErrorCodes['2200B'] = 'escape_character_conflict';

postgresqlErrorCodes['22022'] = 'indicator_overflow';
postgresqlErrorCodes['22015'] = 'interval_field_overflow';
postgresqlErrorCodes['2201E'] = 'invalid_argument_for_logarithm';
postgresqlErrorCodes['22014'] = 'invalid_argument_for_ntile_function';
postgresqlErrorCodes['22016'] = 'invalid_argument_for_nth_value_function';
postgresqlErrorCodes['2201F'] = 'invalid_argument_for_power_function';
postgresqlErrorCodes['2201G'] = 'invalid_argument_for_width_bucket_function';
postgresqlErrorCodes['22018'] = 'invalid_character_value_for_cast';
postgresqlErrorCodes['22007'] = 'invalid_datetime_format';
postgresqlErrorCodes['22019'] = 'invalid_escape_character';
postgresqlErrorCodes['22P02'] = 'invalid_datatype';
postgresqlErrorCodes[''] = '';

export const DISALLOWED_EMAIL_DOMAIN = [
  '0x01.gq',
  '0x01.tk',
  '10mail.org',
  '10mail.tk',
  '33m.co',
  '33mail.com',
  '3dxtras.com',
  '3utilities.com',
  '567map.xyz',
  '8191.at',
  'aa.am',
  'accountsite.me',
  'acmetoy.com',
  'acusupply.com',
  'adultvidlite.com',
  'aji.kr',
  'anonaddy.com',
  'anonaddy.me',
  'anonbox.net',
  'anyalias.com',
  'asanatest1.us',
  'azzawajalla.store',
  'bajetesik.store',
  'band-freier.de',
  'bandband1.com',
  'bangmadid.store',
  'batikbantul.com',
  'bccto.me',
  'bebekpenyet.buzz',
  'bei.kr',
  'bel.kr',
  'beo.kr',
  'bfo.kr',
  'bgsaddrmwn.me',
  'bho.kr',
  'biasaelho.space',
  'biz.st',
  'biz.tm',
  'bko.kr',
  'blacksong.pw',
  'blueauramassage.com',
  'bounceme.net',
  'bum.net',
  'buwosok.tech',
  'buzzndaraiangop2wae.buzz',
  'byui.me',
  'caboodle.buzz',
  'cad.edu.gr',
  'cempue.online',
  'chickenkiller.com',
  'choirul.host',
  'cid.kr',
  'ciran.xyz',
  'cko.kr',
  'cloudns.asia',
  'cloudns.cc',
  'cloudns.cx',
  'cloudns.nz',
  'com.com',
  'coms.hk',
  'comx.cf',
  'craigslist.org',
  'creo.site',
  'creo.tips',
  'creou.dev',
  'crowdpress.it',
  'cu.cc',
  'cua77.xyz',
  'd3vs.net',
  'dadosa.xyz',
  'danuarte.online',
  'darrels.site',
  'daseus.online',
  'dayatan.host',
  'dbo.kr',
  'ddns.net',
  'ddnsfree.com',
  'deail.com',
  'dedyn.io',
  'defaultdomain.ml',
  'discard-email.cf',
  'dko.kr',
  'dlink.cf',
  'dlink.gq',
  'dlyemail.com',
  'dmtc.dev',
  'dmtc.edu.pl',
  'dmtc.press',
  'dns-cloud.net',
  'dns.navy',
  'dnsabr.com',
  'dnses.ro',
  'doy.kr',
  'drope.ml',
  'dropmail.me',
  'dynu.net',
  'dzalaev-advokat.ru',
  'e4ward.com',
  'ediantenan.site',
  'edu.auction',
  'efo.kr',
  'eho.kr',
  'ely.kr',
  'email-temp.com',
  'emailfake.com',
  'emailfake.ml',
  'emailfreedom.ml',
  'emlhub.com',
  'emlpro.com',
  'emltmp.com',
  'emy.kr',
  'enu.kr',
  'eny.kr',
  'epizy.com',
  'escritossad.net',
  'ese.kr',
  'esy.es',
  'ewa.kr',
  'exi.kr',
  'ezyro.com',
  'fackme.gq',
  'fassagforpresident.ga',
  'firste.ml',
  'flu.cc',
  'foy.kr',
  'fr.nf',
  'freeml.net',
  'gadzooks.buzz',
  'gettrials.com',
  'giize.com',
  'gmail.gr.com',
  'gmeil.me',
  'gok.kr',
  'gotdns.ch',
  'gpa.lu',
  'grigio.cf',
  'guardmail.cf',
  'haddo.eu',
  'heliohost.org',
  'higogoya.com',
  'historial.store',
  'hitechinfo.com',
  'hix.kr',
  'hiz.kr',
  'hmail.us',
  'hopto.org',
  'hostingarif.me',
  'idn.vn',
  'iesco.info',
  'igg.biz',
  'ignorelist.com',
  'iki.kr',
  'ilovemyniggers.club',
  'imouto.pro',
  'info.tm',
  'infos.st',
  'irr.kr',
  'isgre.at',
  'it2-mail.tk',
  'jil.kr',
  'jindmail.club',
  'jto.kr',
  'junnuok.com',
  'justemail.ml',
  'kadokawa.top',
  'kantal.buzz',
  'keitin.site',
  'kentel.buzz',
  'kerl.cf',
  'kerl.gq',
  'kikwet.com',
  'kondomeus.site',
  'kozow.com',
  'kranjingan.store',
  'kranjingan.tech',
  'kranjingans.tech',
  'kro.kr',
  'lal.kr',
  'laste.ml',
  'lbe.kr',
  'legundi.site',
  'lei.kr',
  'likevip.net',
  'liopers.link',
  'lko.co.kr',
  'lko.kr',
  'll47.net',
  'lofteone.ru',
  'lom.kr',
  'longdz.site',
  'longmusic.com',
  'lostandalone.com',
  'loudcannabisapp.com',
  'loy.kr',
  'loyalherceghalom.ml',
  'luk2.com',
  'luksarcenter.ru',
  'luo.kr',
  'lyrics-lagu.me',
  'mail-temp.com',
  'mail0.ga',
  'mailinator.com',
  'mailr.eu',
  'marrone.cf',
  'mbe.kr',
  'mblimbingan.space',
  'mebelnovation.ru',
  'mefound.com',
  'mintemail.com',
  'mishmash.buzz',
  'mko.kr',
  'mlo.kr',
  'mooo.com',
  'motifasidiri.website',
  'mp-j.cf',
  'mp-j.ga',
  'mp-j.gq',
  'mp-j.ml',
  'mp-j.tk',
  'mr-meshkat.com',
  'mrossi.cf',
  'mrossi.gq',
  'mrossi.ml',
  'ms1.email',
  'msdc.co',
  'muabanwin.net',
  'museumplanet.com',
  'my.id',
  'my3mail.cf',
  'my3mail.ga',
  'my3mail.gq',
  'my3mail.ml',
  'my3mail.tk',
  'myddns.me',
  'myeslbookclub.com',
  'mymy.cf',
  'mysafe.ml',
  'mzon.store',
  'n-e.kr',
  'nafko.cf',
  'nctu.me',
  'netmail.tk',
  'netricity.nl',
  'new-mgmt.ga',
  'ngalasmoen.xyz',
  'ngguwokulon.online',
  'njambon.space',
  'nko.kr',
  'now.im',
  'npv.kr',
  'nuo.co.kr',
  'nuo.kr',
  'nut.cc',
  'o-r.kr',
  'oazis.site',
  'obo.kr',
  'ocry.com',
  'office.gy',
  'okezone.bid',
  'one.pl',
  'onlysext.com',
  'oovy.org',
  'oppoesrt.online',
  'orangotango.ml',
  'otherinbox.com',
  'ourhobby.com',
  'owa.kr',
  'owh.ooo',
  'oyu.kr',
  'p-e.kr',
  'pafnuty.com',
  'pandies.space',
  'paqeh.online',
  'pe.hu',
  'petinggiean.tech',
  'peyekkolipi.buzz',
  'poderosamulher.com',
  'poistaa.com',
  'porco.cf',
  'poy.kr',
  'prapto.host',
  'probatelawarizona.com',
  'ptcu.dev',
  'pubgm.website',
  'qbi.kr',
  'qc.to',
  'r-e.kr',
  'ragel.me',
  'rao.kr',
  'reilis.site',
  'rf.gd',
  'ringen.host',
  'rko.kr',
  'rosso.ml',
  'row.kr',
  'rr.nu',
  'rshagor.xyz',
  's-ly.me',
  'safe-mail.gq',
  'sagun.info',
  'samsueng.site',
  'saucent.online',
  'sborra.tk',
  'schwarzmail.ga',
  'seluang.com',
  'sempak.link',
  'sendaljepit.site',
  'sendangagung.online',
  'servegame.com',
  'shp7.cn',
  'siambretta.com',
  'skodaauto.cf',
  'soju.buzz',
  'solidplai.us',
  'somee.com',
  'spamtrap.ro',
  'spymail.one',
  'ssanphone.me',
  'standeight.com',
  'statuspage.ga',
  'steakbeef.site',
  'stonedogdigital.com',
  'stop-my-spam.pp.ua',
  'storeyee.com',
  'sumanan.site',
  'supere.ml',
  'svblog.com',
  'sytes.net',
  'tandy.co',
  'tangtingtung.tech',
  'teml.net',
  'tempembus.buzz',
  'tempremail.cf',
  'tempremail.tk',
  'tgwrzqr.top',
  'thepieter.com',
  'theworkpc.com',
  'thinktimessolve.info',
  'thumoi.com',
  'tko.co.kr',
  'tko.kr',
  'tmo.kr',
  'tmpeml.com',
  'toh.info',
  'toi.kr',
  'tomcrusenono.host',
  'topikurrohman.xyz',
  'tourbalitravel.com',
  'traveldesk.com',
  'tricakesi.store',
  'trillianpro.com',
  'twilightparadox.com',
  'tyrex.cf',
  'uha.kr',
  'uk.to',
  'uko.kr',
  'umy.kr',
  'unaux.com',
  'undo.it',
  'uny.kr',
  'uola.org',
  'upy.kr',
  'urbanban.com',
  'us.to',
  'usa.cc',
  'uu.gl',
  'uvy.kr',
  'uyu.kr',
  'vay.kr',
  'vba.kr',
  'veo.kr',
  'viola.gq',
  'vivoheroes.xyz',
  'vkbags.in',
  'vo.uk',
  'volvo-xc.tk',
  'vuforia.us',
  'wakultimbo.buzz',
  'web.id',
  'weprof.it',
  'werkuldino.buzz',
  'wil.kr',
  'wingkobabat.buzz',
  'x24hr.com',
  'xiaomie.store',
  'xo.uk',
  'xxi2.com',
  'yarien.eu',
  'yawahid.host',
  'ye.vc',
  'yertxenor.tk',
  'yomail.info',
  'yopmail.com',
  'yoqoyyum.space',
  'youdontcare.com',
  'zalvisual.us',
  'zapto.org',
  'ze.cx',
  'zeroe.ml'
];
