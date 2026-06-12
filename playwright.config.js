const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testMatch: '*.test.js',
  use: {
    browserName: 'chromium',
    headless: true,
  },
  reporter: [['list']],
});
