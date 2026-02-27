// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock performance.now for Node.js environment
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}