module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: String.raw`.*\.(integration\.spec|e2e-spec)\.ts$`,
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@credebl/(.*)$': '<rootDir>/libs/$1/src',
    '^libs/(.*)$': '<rootDir>/libs/$1/src',
    '^apps/(.*)$': '<rootDir>/apps/$1/src',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['dotenv/config'],
};
