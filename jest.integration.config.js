'use strict';

const baseConfig = require('./package.json').jest; // eslint-disable-line @typescript-eslint/no-var-requires

const config = {
  ...baseConfig,
  // Globs avoid regex escaping; matches integration + e2e specs only.
  testMatch: ['**/*.e2e-spec.ts', '**/*.integration.spec.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    // Scaffolded suites that fail on main too (same set excluded in
    // jest.ci.config.js): they boot full modules against infra and/or assert
    // the Nest "Hello World!" placeholder route, which these apps don't serve.
    // Re-enable each once it has a real integration test.
    '<rootDir>/apps/api-gateway/test/',
    '<rootDir>/apps/agent-provisioning/test/',
    '<rootDir>/apps/agent-service/test/',
    '<rootDir>/apps/connection/test/',
    '<rootDir>/apps/user/test/'
  ],
  setupFiles: ['dotenv/config'],
};

// Base config provides testRegex (unit specs); testMatch supersedes it here.
delete config.testRegex;

module.exports = config;
