import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    workers: 1,
    forbidOnly: !!process.env.CI, // Fail the build on CI if you accidentally left test.only in the source code
    retries: 2,
    reporter: 'html', // We use blob on CI to enable sharding
    use: {
        baseURL: process.env.UI_BASE_URL,
        trace: 'on-first-retry',
        video: 'on-first-retry',
    },
    timeout: 30000,
    expect: {
        toMatchSnapshot: {
            maxDiffPixels: 2000,
        },
    },
});
