import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'VITE_SUPABASE_URL=http://dummy VITE_SUPABASE_ANON_KEY=dummy npm run dev -w frontend',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
