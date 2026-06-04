// Stub env vars that modules read at import time
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.SMTP_HOST = 'localhost';
process.env.API_GATEWAY_NKEY_SEED = 'test-seed';
process.env.USER_MANAGEMENT_NKEY_SEED = 'test-seed';
process.env.NODE_ENV = 'test';
process.env.PLATFORM_NAME = 'CREDEBL-TEST';
process.env.API_GATEWAY_PORT = '5000';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
