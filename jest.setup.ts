'use strict';

// DTO validation uses this to cap batch payloads. Provide a deterministic default for tests.
process.env.OOB_BATCH_SIZE = process.env.OOB_BATCH_SIZE || '10';
