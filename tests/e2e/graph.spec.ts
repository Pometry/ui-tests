import { expect, Page, test } from '@playwright/test';
import {
    dragSlider,
    navigateToGraphPageBySearch,
    navigateToSavedGraphBySavedGraphsTable,
    selectLayout,
    toggleAccordion,
    waitForLayoutToFinish,
} from './utils';

async function fitView(page: Page) {
    await page
        .getByRole('button', { name: 'Fit all nodes within visible region' })
        .click();
    await waitForLayoutToFinish(page);
}

export async function changeTab(page: Page, tabName: string) {
    await page.getByRole('tab', { name: tabName, exact: true }).click();
    // This is to wait for the animation for changing tabs to finish
    await page.waitForTimeout(500);
}

const CANVAS_ELEMENT_POSITIONS = {
    'no graph': {
        'single node': {
            x: 370,
            y: 180,
        },
        'single edge two nodes': [
            {
                x: 450,
                y: 305,
            },
            {
                x: 270,
                y: 110,
            },
        ],
        'pedro expanded': {
            'hamza->pedro': {
                x: 366,
                y: 155,
            },
            pedro: {
                x: 442,
                y: 104,
            },
            hamza: {
                x: 260,
                y: 235,
            },
        },
    },
    'new_folder/persistent_filler': {
        pedro: {
            x: 455,
            y: 218,
        },
        ben: {
            x: 331,
            y: 212,
        },
    },
    'new_folder/persistent_second_filler': {
        'Judy->Rabbit Inc': {
            x: 459,
            y: 151,
        },
    },
};

test('Close right hand side panel button and open again', async ({ page }) => {
    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');

    await page
        .locator(
            '.MuiButtonBase-root.MuiButton-root.MuiButton-text.MuiButton-textPrimary',
        )
        .nth(5)
        .click();
    await (await page.waitForSelector('text="Pedro"')).isHidden();
    await page.getByText('Overview').isHidden();

    await page
        .locator(
            '.MuiButtonBase-root.MuiButton-root.MuiButton-text.MuiButton-textPrimary',
        )
        .nth(5)
        .click();

    await page.getByText('Overview').isVisible();
});

test('Click save as button opens save as dialog', async ({ page }) => {
    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');
    await page.locator('button:has-text("Save As")').click();
    await page.getByRole('button', { name: 'Cancel' }).waitFor();
    await expect(page.getByText('New Graph Name')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('New Graph Name')).toBeHidden();
});

test('Highlight founds then transfers', async ({ page }) => {
    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');
    await expect(page.getByRole('progressbar')).toBeHidden();
    await page.getByRole('button', { name: 'Relationships' }).waitFor();
    await page
        .getByRole('row', { name: 'transfers' })
        .getByRole('button')
        .click();
    await expect(
        page.locator('g', { hasText: /^Ben$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(117, 135, 72)');
    await expect(
        page.locator('g', { hasText: /^Hamza$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(117, 135, 72)');
    await expect(
        page.locator('g', { hasText: /^Pedro$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(117, 135, 72)');
    await page.getByRole('row', { name: 'founds' }).getByRole('button').click();
    await expect(
        page.locator('g', { hasText: /^Ben$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(117, 135, 72)');
    await expect(
        page.locator('g', { hasText: /^Hamza$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(117, 135, 72)');
    await expect(
        page.locator('g', { hasText: /^Pometry$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(93, 212, 223)');
});

test('Test layouts', async ({ page }) => {
    test.setTimeout(60000);
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'event');

    // The extra timeout here helps to make the next line more consistent
    await waitForLayoutToFinish(page, 3000, 3000);
    await selectLayout(page, 'Concentric Layout');
    expect(await page.screenshot()).toMatchSnapshot('concentric-layout.png');
    await selectLayout(page, 'Force Based Layout');

    expect(await page.screenshot()).toMatchSnapshot('force-based-layout.png');
    await selectLayout(page, 'Hierarchical TD Layout');

    expect(await page.screenshot()).toMatchSnapshot(
        'hierarchical-td-layout.png',
    );
    await selectLayout(page, 'Hierarchical LR Layout');
    expect(await page.screenshot()).toMatchSnapshot(
        'hierarchical-lr-layout.png',
    );
    await selectLayout(page, 'Default Layout');
    expect(await page.screenshot()).toMatchSnapshot('default-layout.png');
});

test('Zoom in, zoom out, fit view button', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'event');

    await page.getByRole('button', { name: 'Zoom in' }).click();
    await waitForLayoutToFinish(page);
    expect(await page.screenshot()).toMatchSnapshot('zoomedin.png');
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await waitForLayoutToFinish(page);
    expect(await page.screenshot()).toMatchSnapshot('zoomedout.png');
    await fitView(page);
    expect(await page.screenshot()).toMatchSnapshot('fitview.png');
});

test('Click on Pometry node in graph', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pometry',
        nodeType: 'Company',
    });
    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await changeTab(page, 'Selected');
    await expect(page.getByRole('heading', { name: 'Pometry' })).toBeVisible();
    await expect(
        page.getByText('No properties found', { exact: true }),
    ).toBeVisible();
});

test('Click on Pedro node in graph', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await changeTab(page, 'Selected');
    await expect(page.getByRole('heading', { name: 'Pedro' })).toBeVisible();
    await expect(page.getByText('Age', { exact: true })).toBeVisible();
});

test('Click on Hamza node in graph', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Hamza',
        nodeType: 'Person',
    });
    await waitForLayoutToFinish(page);
    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await changeTab(page, 'Selected');
    await expect(page.getByRole('heading', { name: 'Hamza' })).toBeVisible();
    await expect(page.getByText('Age', { exact: true })).toBeVisible();
});

test('Click on Ben node in graph', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Ben',
        nodeType: 'Person',
    });
    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await changeTab(page, 'Selected');
    await expect(page.getByRole('heading', { name: 'Ben' })).toBeVisible();
    await expect(page.getByText('Age', { exact: true })).toBeVisible();
});

test('Double click expand node and delete by floating actions button', async ({
    page,
}) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await changeTab(page, 'Selected');
    await expect(page.getByRole('heading', { name: 'Pedro' })).toBeVisible();
    await page
        .getByRole('button', {
            name: 'Delete selected node from current graph',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.screenshot()).toMatchSnapshot('deletednode.png', {
        maxDiffPixels: 100,
        maxDiffPixelRatio: 0.01,
    });
    await changeTab(page, 'Overview');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();

    await waitForLayoutToFinish(page);
    await page.locator('canvas').nth(1).dblclick({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await waitForLayoutToFinish(page);

    await expect(page.getByText('Ben')).toBeVisible();
    await expect(page.getByText('Hamza')).toBeVisible();
});

test('Expand node by floating actions button', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });

    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await page
        .getByRole('button', {
            name: 'Explore',
            exact: true,
        })
        .click();
    await page
        .getByRole('menuitem', {
            name: 'Expand and show all nodes directly related to selected node',
            exact: true,
        })
        .click();
    await page.waitForSelector('text=Pedro');
    await expect(page.getByText('Ben')).toBeVisible();
    await expect(page.getByText('Hamza')).toBeVisible();
    await expect(page.getByText('Pedro')).toBeVisible();
});

test('Expand two-hop by floating actions button', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });

    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await page
        .getByRole('button', {
            name: 'Explore',
            exact: true,
        })
        .click();
    await page
        .getByRole('menuitem', {
            name: 'Expand Two-Hop',
            exact: true,
        })
        .click();
    await page.waitForSelector('text=Pedro');
    await expect(page.getByText('Ben')).toBeVisible();
    await expect(page.getByText('Hamza')).toBeVisible();
    await expect(page.getByText('Pedro')).toBeVisible();
    await expect(page.getByText('Pometry')).toBeVisible();
});

test('Expand shared neighbours by floating actions button', async ({
    page,
}) => {
    await navigateToGraphPageBySearch(page, {
        type: 'edge',
        src: 'Hamza',
        dst: 'Pedro',
        layers: ['meets'],
    });

    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['no graph']['single edge two nodes'][0],
    });

    await page
        .locator('canvas')
        .nth(1)
        .click({
            modifiers: ['Shift'],
            position:
                CANVAS_ELEMENT_POSITIONS['no graph'][
                    'single edge two nodes'
                ][1],
        });

    await page
        .getByRole('button', {
            name: 'Explore',
            exact: true,
        })
        .click();
    await page
        .getByRole('menuitem', {
            name: 'Shared Neighbours',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    await page.waitForSelector('text=Ben');
    await expect(page.getByText('Ben')).toBeVisible();
    await expect(page.getByText('Hamza')).toBeVisible();
    await expect(page.getByText('Pedro')).toBeVisible();
});

test('Click edge to reveal right hand side panel details', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });

    await page.locator('canvas').nth(1).dblclick({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await waitForLayoutToFinish(page, 2000, 2000);
    await fitView(page);
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['no graph']['pedro expanded'][
                'hamza->pedro'
            ],
    });
    await page.waitForTimeout(100);
    await changeTab(page, 'Selected');
    await page.getByRole('button', { name: 'Edge Statistics' }).click();
    await expect(page.getByText('Madrid')).toBeVisible();
    await expect(page.getByText('Layer Names')).toBeVisible();
    await expect(page.getByText('Earliest Time')).toBeVisible();
    await expect(page.getByText('Latest Time')).toBeVisible();
    await expect(page.getByText('meets, transfers')).toBeVisible();
    await expect(page.getByText('Hamza -> Pedro')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await changeTab(page, 'Pedro -> Hamza Log');
    await expect(page.getByText('Pedro -> transfers -> Hamza')).toBeVisible();
});

test('Undo and redo in floating actions menu', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await page.locator('canvas').nth(1).dblclick({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await waitForLayoutToFinish(page);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await page.waitForSelector('text=Pedro');
    await expect(page.getByText('Ben')).toBeVisible();
    await expect(page.getByText('Hamza')).toBeVisible();
    await expect(page.getByText('Pedro')).toBeVisible();
});

test('Expand node, fit view and select all similar nodes', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    const temporalView = await page.locator('#temporal-view').boundingBox();
    await page.locator('canvas').nth(1).dblclick({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await waitForLayoutToFinish(page);
    await page.waitForSelector('text="Pedro"');
    await fitView(page);
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['no graph']['pedro expanded']['pedro'],
    });
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Select all similar nodes' })
        .click();
    await waitForLayoutToFinish(page);
    if (temporalView) {
        expect(await page.screenshot({ clip: temporalView })).toMatchSnapshot(
            'selectsimilarnodes.png',
            {
                maxDiffPixels: 20000,
                maxDiffPixelRatio: 0.01,
            },
        );
    } else {
        throw new Error('Element not found or not visible');
    }
});

test('Click and deselect by floating actions', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await page.locator('canvas').nth(1).click({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await changeTab(page, 'Selected');

    await expect(page.getByText('Pedro').nth(0)).toBeVisible();
    await page.getByRole('button', { name: 'Selection' }).click();
    await page.getByRole('menuitem', { name: 'Deselect all nodes' }).click();
    await waitForLayoutToFinish(page);
    expect(await page.screenshot()).toMatchSnapshot('deselectnodes.png', {
        maxDiffPixels: 20000,
        maxDiffPixelRatio: 0.01,
    });
});

test('Click backspace to delete nodes', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await page.locator('canvas').nth(1).dblclick({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await waitForLayoutToFinish(page);
    await page.waitForSelector('text="Pedro"');
    await fitView(page);
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['no graph']['pedro expanded']['hamza'],
    });
    await page.keyboard.press('Backspace');
    await expect(page.getByText('Hamza')).toBeHidden();
    await expect(page.getByText('Pedro')).toBeVisible();
    await expect(page.getByText('Ben')).toBeVisible();
});

test('Change colour and size of node', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'new_folder',
        'persistent_filler',
    );
    await fitView(page);
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['new_folder/persistent_filler']['pedro'],
    });
    await changeTab(page, 'Graph settings');
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .click();

    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('BD10E0');
    await page.getByRole('spinbutton', { name: 'Node Size' }).fill('30');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(3000);
    expect(await page.screenshot()).toMatchSnapshot(
        'node-colour-size-change.png',
    );
    await page
        .getByRole('button', { name: 'Clear Individual Node Style' })
        .click();
    await page.waitForTimeout(2000);
});

test('Change colour of edge by layer dropdown', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'new_folder',
        'persistent_second_filler',
    );
    await fitView(page);

    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['new_folder/persistent_second_filler'][
                'Judy->Rabbit Inc'
            ],
    });
    await changeTab(page, 'Graph settings');
    await page.getByRole('combobox', { name: 'Select Edge Layer' }).click();
    await page.getByRole('option', { name: 'advises' }).click();
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
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(5000);
    expect(await page.screenshot()).toMatchSnapshot(
        'edge-colour-change-layer-dropdown.png',
    );
    await page.getByRole('button', { name: 'Reset To Default Style' }).click();

    await page.waitForTimeout(2000);
});
test('Change colour and size of node by type', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'persistent');
    await fitView(page);

    await changeTab(page, 'Graph settings');
    await page.getByRole('combobox', { name: 'Select Node Type' }).click();
    await page.getByRole('option', { name: 'Person' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .click();

    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('D0021B');
    await page.getByRole('spinbutton', { name: 'Node Size' }).fill('30');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(2000);
    expect(await page.screenshot()).toMatchSnapshot(
        'node-type-colour-size-change.png',
    );
    await page
        .getByRole('button', { name: 'Reset To Default Type Style' })
        .click();
    await page.waitForTimeout(2000);
});

test('Preview colour and size by type changes', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'second_filler',
    );
    await fitView(page);
    await changeTab(page, 'Graph settings');
    await page.getByRole('combobox', { name: 'Select Node Type' }).click();
    await page.getByRole('option', { name: 'Person' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .click();

    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('D0021B');
    await page.getByRole('spinbutton', { name: 'Node Size' }).fill('30');
    await page.waitForTimeout(1000);
    expect(await page.screenshot()).toMatchSnapshot(
        'preview-node-type-colour-size-change.png',
    );
});

test('Preview colour and size changes', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );
    await fitView(page);
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['new_folder/persistent_filler']['ben'],
    });
    await changeTab(page, 'Graph settings');
    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .click();

    await page
        .locator('div')
        .filter({ hasText: /^Hex$/ })
        .getByRole('textbox')
        .fill('BD10E0');
    await page.getByRole('spinbutton', { name: 'Node Size' }).fill('30');
    await page.waitForTimeout(1000);
    expect(await page.screenshot()).toMatchSnapshot(
        'preview-node-colour-size-change.png',
    );
});

test('Preview edge colour changes', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_second_filler',
    );
    await fitView(page);

    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['new_folder/persistent_second_filler'][
                'Judy->Rabbit Inc'
            ],
    });
    await changeTab(page, 'Graph settings');
    await page.getByRole('combobox', { name: 'Select Edge Layer' }).click();
    await page.getByRole('option', { name: 'advises' }).click();
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
    expect(await page.screenshot()).toMatchSnapshot(
        'preview-edge-colour-change-layer-dropdown.png',
    );
});

test('Layout Customizer Default Advanced Options', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );
    await changeTab(page, 'Layout');

    await toggleAccordion(page, 'Advanced Options');

    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'layout-customizer-default.png',
    );
    await dragSlider({
        page,
        slider: page.getByLabel('Nodes start repelling each'),
        root: page.getByLabel('Collision Radius Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('The strength with which the'),
        root: page.getByLabel('Collision Strength Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('The ideal edge length'),
        root: page.getByLabel('Link Distance Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('The strength of the link'),
        root: page.getByLabel('Link Strength Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('A negative force represents "'),
        root: page.getByLabel('Many-Body Force Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('The minimum/maximum distance').first(),
        root: page.getByLabel('Many-Body Range Slider Container'),
        sliderPosition: 0.2,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('The minimum/maximum distance').nth(1),
        root: page.getByLabel('Many-Body Range Slider Container'),
        sliderPosition: 0.8,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('Force pulls nodes towards'),
        root: page.getByLabel('Center Force Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('Strength of the radial force'),
        root: page.getByLabel('Radial force strength Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('Radius of the radial force'),
        root: page.getByLabel('Radial force radius Slider Container'),
        sliderPosition: 0.5,
    });
    await page
        .getByRole('button', { name: 'Rerun layout', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'layout-customizer-default-all-changed.png',
    );
});

test('Layout Customizer Default Pre-layout', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );
    await changeTab(page, 'Layout');

    await toggleAccordion(page, 'Pre-layout Advanced Options');

    await page.getByRole('checkbox', { name: 'Use Clockwise' }).check();
    await page
        .getByRole('checkbox', { name: 'Maintain equidistant rings' })
        .check();
    await dragSlider({
        page,
        slider: page.getByLabel('Used for collision detection'),
        root: page.getByLabel('Node size (diameter) Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('Minimum spacing between rings'),
        root: page.getByLabel('Node spacing Slider Container'),
        sliderPosition: 0.5,
    });
    await page.getByRole('checkbox', { name: 'Prevent overlap' }).check();
    await dragSlider({
        page,
        slider: page.getByLabel('The angle (in radians) to'),
        root: page.getByLabel('Start Angle (pi radians) Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel(
            'The angle difference between the first and last node in the same layer',
        ),
        root: page.getByLabel('Sweep Slider Container'),
        sliderPosition: 0.5,
    });
    await page
        .getByRole('button', { name: 'Rerun layout', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'layout-customizer-prelayout-all-changed.png',
    );
});

test('Layout Customizer can change to concentric layout', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );
    await changeTab(page, 'Layout');

    await page.getByRole('combobox', { name: 'Layout Algorithm' }).click();
    await page.getByRole('option', { name: 'Concentric Layout' }).click();

    await toggleAccordion(page, 'Advanced Options');

    await page.getByRole('checkbox', { name: 'Use Clockwise' }).check();
    await page
        .getByRole('checkbox', { name: 'Maintain equidistant rings' })
        .check();
    await dragSlider({
        page,
        slider: page.getByLabel('Used for collision detection'),
        root: page.getByLabel('Node size (diameter) Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel('Minimum spacing between rings'),
        root: page.getByLabel('Node spacing Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel(
            'The angle (in radians) to start laying out nodes',
        ),
        root: page.getByLabel('Start Angle (pi radians) Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel(
            'The angle difference between the first and last node in the same layer',
        ),
        root: page.getByLabel('Sweep Slider Container'),
        sliderPosition: 0.5,
    });
    await page
        .getByRole('button', { name: 'Rerun layout', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    await fitView(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'layout-customizer-concentric-all-changed.png',
    );
});

test('Layout Customizer can use dagre for pre-layout', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );
    await changeTab(page, 'Layout');

    await page.getByRole('combobox', { name: 'Pre-layout' }).click();
    await page.getByRole('option', { name: 'Hierarchical TD Layout' }).click();

    await toggleAccordion(page, 'Pre-layout Advanced Options');

    await page.getByRole('checkbox', { name: 'Invert' }).check();
    await page.getByRole('combobox', { name: 'Alignment' }).click();
    await page.waitForTimeout(200); // select animation
    await page.getByRole('option', { name: 'Upper Right' }).click();
    await page.waitForTimeout(200); // select animation
    await dragSlider({
        page,
        slider: page.getByLabel("For TB or BT, it's the horizontal spacing"),
        root: page.getByLabel('Node separation (px) Slider Container'),
        sliderPosition: 0.5,
    });
    await dragSlider({
        page,
        slider: page.getByLabel("For TB or BT, it's the vertical spacing"),
        root: page.getByLabel('Rank separation (px) Slider Container'),
        sliderPosition: 0.5,
    });
    await page.getByRole('combobox', { name: 'Ranking algorithm' }).click();
    await page.waitForTimeout(200); // select animation
    await page.getByRole('option', { name: 'tight-tree' }).click();
    await page.waitForTimeout(200); // select animation
    await dragSlider({
        page,
        slider: page.getByLabel('Size of node'),
        root: page.getByLabel('Node size Slider Container'),
        sliderPosition: 0.5,
    });
    await page
        .getByRole('checkbox', { name: 'Retain edge control points' })
        .check();
    await page
        .getByRole('button', { name: 'Rerun layout', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'layout-customizer-prelayout-dagre-all-changed.png',
    );
});

test('catch console logs and errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];

    page.on('console', (message) => {
        switch (message.type()) {
            case 'error': {
                consoleErrors.push(message.text());
                break;
            }
            case 'log': {
                consoleLogs.push(message.text());
                break;
            }
        }
    });

    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');

    expect(consoleErrors, 'Console errors found').toStrictEqual([]);
    expect(consoleLogs, 'Console logs found').toStrictEqual([]);
});

// skipping because it only works for one browser test, fails on other browser repeats (graph already exists after creating once in chromium)
test.skip('save new graph with save as dialog', async ({ page }) => {
    await page.goto('/graph?initialNodes=%5B"Pedro"%5D&baseGraph=event');

    await page.locator('button:has-text("Save As")').click();
    await expect(page.getByLabel('New Graph Name')).toBeVisible();

    await page.getByLabel('New Graph Name').fill('Test Graph');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.waitForLoadState('networkidle');

    await page.waitForURL(
        /\/graph\?graphSource=Test(\+|%20)Graph&initialNodes=%5B%5D/,
    );

    await expect(page.locator('input')).toHaveValue('Test Graph');
});
