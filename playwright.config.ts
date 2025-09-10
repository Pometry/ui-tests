import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: 'tests/e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    // /* Fail the build on CI if you accidentally left test.only in the source code. */
    // forbidOnly: !!process.env.CI,
    // /* Retry on CI only */
    retries: 3,
    // /* Opt out of parallel tests on CI. */
    // workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],
    /* Run your local dev server before starting the tests */
    webServer: [
        {
            name: 'raphtory-gql',
            command: `docker run --read-only -v ${path.resolve(__dirname, '../applications/vanilla/test_server.py')}:/var/lib/raphtory/test_server.py -v /tmp/vanilla-graphs:/tmp/vanilla-graphs -p 1736:1736 --entrypoint="python" pometry/raphtory:${process.env.RAPHTORY_GRAPHQL_DOCKER_TAG}-python /var/lib/raphtory/test_server.py`,
            port: 1736,
            timeout: 180 * 1000,
            stdout: 'pipe',
        },
        {
            name: 'vanilla-prod',
            command: 'cd .. && pnpm production-vanilla',
            port: 3000,
            timeout: 120 * 1000,
        },
    ],

    expect: {
        toMatchSnapshot: {
            maxDiffPixels: 2000,
        },
    },
});
