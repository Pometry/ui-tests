import { test as base, Page } from '@playwright/test';
import { changeTab, clickOnEdge, clickOnNode } from './e2e/utils';

interface MyFixtures {
    settingsPage: Page;
    comprehensiveStylingPage: Page;
}

// Extend base test by providing our own Page extensions.
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<MyFixtures>({
    settingsPage: async ({ page }, use) => {
        await use(page);

        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.waitForTimeout(2000);
    },
    comprehensiveStylingPage: async ({ page }, use) => {
        await use(page);

        const closeTimeline = page.getByRole('button', {
            name: 'Close timeline',
        });
        if (await closeTimeline.isVisible()) {
            await closeTimeline.click();
            await page.waitForTimeout(300);
        }

        await clickOnNode(page, 'Pedro');
        await changeTab(page, 'Styling');
        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.waitForTimeout(2000);

        await page
            .getByRole('cell', { name: 'Click here to edit the type' })
            .click();

        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.waitForTimeout(2000);

        await clickOnEdge(page, 'Pedro', 'Hamza');
        await changeTab(page, 'Styling');
        await page.waitForTimeout(100);
        await page.getByText('Select Edge Layer').click();
        await page.getByRole('option', { name: 'founds' }).click();
        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.waitForTimeout(2000);
    },
});
export { expect } from '@playwright/test';
