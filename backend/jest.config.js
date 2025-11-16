module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.js'],
  verbose: true,
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
};
