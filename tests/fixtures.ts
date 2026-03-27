import { test as base, Page } from '@playwright/test';
import {
    changeTab,
    clickOnEdge,
    clickOnNode,
    navigateToSavedGraphBySavedGraphsTable,
} from './e2e/utils';

interface MyFixtures {
    settingsPage: Page;
    comprehensiveStylingPage: Page;
}

async function resetThenWait(page: Page) {
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2000);
}

async function resetNodesOfSameType(page: Page, nodeNames: string[]) {
    await changeTab(page, 'Styling');
    for (const name of nodeNames) {
        await clickOnNode(page, name);
        await resetThenWait(page);
    }
    await page
        .getByRole('cell', { name: 'Click here to edit the type' })
        .click();
    await resetThenWait(page);
}

async function resetEdge(
    page: Page,
    src: string,
    dst: string,
    layerName: string,
) {
    await changeTab(page, 'Styling');
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Clear current selection' })
        .click();
    await clickOnEdge(page, src, dst);
    await page.waitForTimeout(100);
    await page.getByText('Select Edge Layer').click();
    await page.getByRole('option', { name: layerName }).click();
    await resetThenWait(page);
}

// Extend base test by providing our own Page extensions.
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<MyFixtures>({
    settingsPage: async ({ page }, use) => {
        await use(page);
        await resetThenWait(page);
    },
    comprehensiveStylingPage: async ({ page }, use) => {
        await use(page);

        await navigateToSavedGraphBySavedGraphsTable(
            page,
            'vanilla',
            'persistent',
        );

        await resetNodesOfSameType(page, ['Pedro', 'Hamza', 'Ben']);
        await resetNodesOfSameType(page, ['Pometry']);
        await resetNodesOfSameType(page, ['None']);

        await resetEdge(page, 'Pedro', 'Hamza', 'meets');
        await resetEdge(page, 'Hamza', 'Pometry', 'founds');
    },
});

export { expect } from '@playwright/test';
