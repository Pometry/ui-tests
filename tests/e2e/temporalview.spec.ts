import { expect, Page, test } from '@playwright/test';
import assert from 'assert';
import {
    navigateToSavedGraphBySavedGraphsTable,
    openTimeline,
    waitForLayoutToFinish,
} from './utils';

async function setupGraphPage(
    page: Page,
    relativePath = 'graph?graphSource=vanilla/event&initialNodes=%5B%5D',
) {
    await page.goto(`/${relativePath}`);
    await waitForLayoutToFinish(page);
    await openTimeline(page);
    return page;
}

async function hoverEdgeAndExpectTooltip(
    page: Page,
    selector: string,
    expectedText: string,
) {
    const temporalViewIsHidden = await page
        .locator('#temporal-view')
        .isHidden();
    if (temporalViewIsHidden) {
        await openTimeline(page);
        await page.waitForTimeout(500);
    }

    const line = page.locator(selector).first();
    await expect(line).toHaveCount(1);

    const box = await line.boundingBox();
    if (!box) throw new Error(`Element ${selector} is not visible or rendered`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByText(expectedText)).toBeVisible();
    await page.mouse.move(0, 0);
}

test('Close temporal view button and open again', async ({ page }) => {
    await setupGraphPage(page);
    await page.getByRole('button', { name: 'Close timeline' }).click();
    await expect(page.locator('text="Ben"')).toBeHidden();
    await openTimeline(page);
    await expect(page.locator('text="Ben"')).toBeVisible();
});

test('Temporal view hover over edges', async ({ page }) => {
    await setupGraphPage(page);

    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(20) > line:nth-child(6)',
        'EdgeBenHamzaLayermeets',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(19) > line:nth-child(6)',
        'EdgeBenPedroLayermeets',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(22) > line:nth-child(6)',
        'EdgeHamzaPometryLayerfounds',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(23) > line:nth-child(6)',
        'EdgeHamzaPedroLayermeets',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(24) > line:nth-child(6)',
        'EdgeHamzaPedroLayermeets',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(25) > line:nth-child(6)',
        'EdgeHamzaPedroLayertransfers',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(18) > line:nth-child(6)',
        'EdgePedroHamzaLayertransfers',
    );
    await hoverEdgeAndExpectTooltip(
        page,
        'g:nth-child(21) > line:nth-child(6)',
        'EdgeBenHamzaLayertransfers',
    );
});

test('Pin node and highlight', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'event');
    await openTimeline(page);
    await page
        .locator('g')
        .filter({ hasText: /^Pometry$/ })
        .locator('image')
        .click();
    expect(await page.screenshot()).toMatchSnapshot('pinnode.png', {
        maxDiffPixels: 3500,
    });
    await page
        .locator('g')
        .filter({ hasText: /^Pometry$/ })
        .locator('circle')
        .click();
    expect(await page.screenshot()).toMatchSnapshot(
        'highlightedandpinned.png',
        {
            maxDiffPixels: 3500,
        },
    );
});

test('Zoom into timeline view', async ({ page }) => {
    await setupGraphPage(page);
    await page.waitForSelector('text="Pometry"');

    const element = page.locator('#temporal-view');
    await expect(element).toBeVisible();
    const box = await element.boundingBox();
    assert(box !== null);
    const offsetX = box.width / 2;
    const offsetY = box.height / 2;

    await page.mouse.move(box.x + offsetX, box.y + offsetY);
    await page.mouse.wheel(0, -2000); // scroll up (zoom in)
    await expect(page.getByText('Pedro')).toBeHidden();
});

test('Highlight node from timeline view', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'event');
    await openTimeline(page);
    await page
        .locator('g')
        .filter({ hasText: /^Ben$/ })
        .locator('circle')
        .click();
    await page.getByRole('tab', { name: 'Selected' }).click();
    await expect(
        page.getByRole('heading', { name: 'Ben', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('PROPERTIES')).toBeVisible();
    await expect(page.getByRole('row', { name: 'Age 30' })).toBeVisible();
    await page
        .locator('g')
        .filter({ hasText: /^Hamza$/ })
        .locator('circle')
        .click({
            modifiers: ['Shift'],
        });
    await expect(
        page.getByRole('heading', { name: 'Hamza', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('PROPERTIES')).toBeVisible();
    await expect(page.getByRole('row', { name: 'Age 30' })).toBeVisible();
});

test('Preview colour of edge on timeline view', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'persistent');
    await openTimeline(page);

    await page.getByLabel('Edge ID Ben->Pedro_meets_1679356800000').click();
    await page.getByRole('tab', { name: 'Styling' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .click();

    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('F5A623');
    await page.waitForTimeout(2000);
    expect(await page.screenshot()).toMatchSnapshot(
        'preview-temporal-edge-colour-change.png',
    );
});

test('Change colour of edge on timeline view', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'filler');
    await openTimeline(page);

    await page.getByLabel('Edge ID Ben->Pedro_meets_50').click();
    await page.getByRole('tab', { name: 'Styling' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .click();
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('');
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('F5A623');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(3_000);
    expect(await page.screenshot()).toMatchSnapshot(
        'temporal-edge-colour-change.png',
    );
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2000);
});
