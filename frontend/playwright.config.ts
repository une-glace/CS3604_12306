import { defineConfig, devices } from '@playwright/test';

const isWin = process.platform === 'win32';
const startCommand = isWin
  ? 'npm run dev'
  : 'bash -c "cd ../backend && npm run dev & npm run dev"';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  webServer: {
    command: startCommand,
    port: 5174,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { VITE_E2E: 'true' }
  },
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'slow-chromium', use: { ...devices['Desktop Chrome'], launchOptions: { slowMo: 75 } } },
  ]
});
