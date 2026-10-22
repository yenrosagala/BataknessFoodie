import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run sequentially to avoid server issues
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run one test at a time
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    headless: true,
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Use system Chrome
      },
    },
  ],
  webServer: {
    command: 'python -m http.server 8000',
    cwd: './',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  timeout: 60000,
});