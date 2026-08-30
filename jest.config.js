module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@aws-appsync/utils)',
  ],
};

