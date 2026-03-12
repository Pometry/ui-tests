import { test as base, Page } from '@playwright/test';

interface MyFixtures {
    settingsPage: Page;
}

// Extend base test by providing our own Page extensions.
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<MyFixtures>({
    settingsPage: async ({ page }, use) => {
        await use(page);

        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.waitForTimeout(2000);
    },
});
export { expect } from '@playwright/test';
