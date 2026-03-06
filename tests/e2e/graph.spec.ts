import { expect, Page, test } from '@playwright/test';
import {
    dragSlider,
    fillInStyling,
    navigateToGraphPageBySearch,
    navigateToSavedGraphBySavedGraphsTable,
    openTimeline,
    selectLayout,
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
            x: 465,
            y: 310,
        },
        'single edge two nodes': [
            {
                x: 215,
                y: 135,
            },
            {
                x: 560,
                y: 500,
            },
        ],
        'pedro expanded': {
            'hamza->pedro': {
                x: 387,
                y: 219,
            },
            pedro: {
                x: 565,
                y: 120,
            },
            hamza: {
                x: 215,
                y: 320,
            },
        },
        'pedro expanded with timeline': {
            hamza: {
                x: 295,
                y: 210,
            },
        },
    },
    'new_folder/persistent_filler': {
        pedro: {
            x: 585,
            y: 340,
        },
        ben: {
            x: 355,
            y: 325,
        },
    },
    'new_folder/persistent_second_filler': {
        'Rabbit Inc': {
            x: 520,
            y: 100,
        },
        'Judy->Rabbit Inc': {
            x: 572,
            y: 205,
        },
    },
};

test('Close right hand side panel button and open again', async ({ page }) => {
    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');

    await page.getByRole('button', { name: 'Collapse panel' }).click();
    await expect(
        page.getByRole('button', { name: 'Collapse panel' }),
    ).toBeHidden();

    await page.getByRole('button', { name: 'Expand Overview' }).click();

    await expect(
        page.getByRole('button', { name: 'Collapse panel' }),
    ).toBeVisible();
});

test('Click save as button opens save as dialog', async ({ page }) => {
    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');
    await page.getByRole('button', { name: 'Save graph as' }).click();
    await page.getByRole('button', { name: 'Cancel' }).waitFor();
    await expect(page.getByText('New Graph Name')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('New Graph Name')).toBeHidden();
});

test('Highlight founds then transfers', async ({ page }) => {
    await page.goto('/graph?graphSource=vanilla%2Fevent&initialNodes=%5B%5D');
    await waitForLayoutToFinish(page);
    await openTimeline(page);
    await page.getByText('Relationships').waitFor();
    await page
        .getByText('transfers3')
        .getByRole('button', { name: 'Highlight on graph' })
        .click();
    await page;
    await expect(
        page.locator('g', { hasText: /^Ben$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(158, 158, 158)');
    await expect(
        page.locator('g', { hasText: /^Hamza$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(158, 158, 158)');
    await expect(
        page.locator('g', { hasText: /^Pedro$/ }).locator('circle'),
    ).toHaveCSS('fill', 'rgb(158, 158, 158)');
    await page
        .getByText('founds2')
        .getByRole('button', { name: 'Highlight on graph' })
        .click();
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
    await selectLayout(page, 'Arrange nodes in concentric circles');
    expect(await page.screenshot()).toMatchSnapshot('concentric-layout.png');
    await selectLayout(page, 'Force-directed layout algorithm');

    expect(await page.screenshot()).toMatchSnapshot('force-based-layout.png');
    await selectLayout(page, 'Top-to-bottom hierarchical tree');

    expect(await page.screenshot()).toMatchSnapshot(
        'hierarchical-td-layout.png',
    );
    await selectLayout(page, 'Left-to-right hierarchical tree');
    expect(await page.screenshot()).toMatchSnapshot(
        'hierarchical-lr-layout.png',
    );
    await selectLayout(page, 'Physics-based layout with natural clustering');
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
    await expect(page.getByText('PROPERTIES')).toBeHidden();
    await expect(page.getByText('STATISTICS')).toBeVisible();
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
            name: 'Delete selected (⌫)',
        })
        .click();
    // Don't include the delete snapshot in tooltip (the ⌫ symbol can create
    // font problems on the pipeline)
    await page.mouse.move(0, 0);
    await waitForLayoutToFinish(page);
    expect(await page.screenshot()).toMatchSnapshot('deletednode.png', {
        maxDiffPixels: 100,
        maxDiffPixelRatio: 0.01,
    });
    await changeTab(page, 'Overview');
    await page.getByRole('button', { name: 'Undo (⌘Z)', exact: true }).click();

    await waitForLayoutToFinish(page);
    await page.locator('canvas').nth(1).dblclick({
        position: CANVAS_ELEMENT_POSITIONS['no graph']['single node'],
    });
    await waitForLayoutToFinish(page);

    await openTimeline(page);
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
            name: 'Show all nodes directly connected to selection',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    await openTimeline(page);
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
            name: 'Show nodes within two connections of selection',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    await openTimeline(page);
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
            name: 'Show nodes connected to all selected nodes',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    await openTimeline(page);
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
    await page.getByRole('button', { name: 'EDGE STATISTICS' }).click();
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
    await page.getByRole('button', { name: 'Undo (⌘Z)', exact: true }).click();
    await waitForLayoutToFinish(page);
    await page.getByRole('button', { name: 'Redo (⌘⇧Z)', exact: true }).click();
    await waitForLayoutToFinish(page);
    await openTimeline(page);
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
    await waitForLayoutToFinish(page);
    await openTimeline(page);
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
        .getByRole('menuitem', {
            name: 'Select all nodes with the same type as selection',
        })
        .click();
    await waitForLayoutToFinish(page);
    const temporalView = await page.locator('#temporal-view').boundingBox();
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
    await page
        .getByRole('menuitem', { name: 'Clear current selection' })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.screenshot()).toMatchSnapshot('deselectnodes.png', {
        maxDiffPixels: 20000,
        maxDiffPixelRatio: 0.01,
    });
});

test('Select all from menu and via shortcut', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'persistent');
    await page.waitForTimeout(500);
    await page.locator('canvas').nth(1).click();
    await page.waitForTimeout(100);
    await page.keyboard.down('Control');
    await page.waitForTimeout(100);
    await page.locator('canvas').nth(1).press('a');
    await page.waitForTimeout(100);
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'select-all.png',
    );
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Clear current selection', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'select-all-then-deselect-all.png',
    );
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', {
            name: 'Select every node in the graph',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'select-all.png',
    );
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
    await openTimeline(page);
    await fitView(page);
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['no graph'][
                'pedro expanded with timeline'
            ]['hamza'],
    });
    await page.keyboard.press('Backspace');
    await expect(page.getByText('Hamza')).toBeHidden();
    await expect(page.getByText('Pedro')).toBeVisible();
    await expect(page.getByText('Ben')).toBeVisible();
});

test('RHS Selected properties has max height for table cells', async ({
    page,
}) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'new_folder',
        'persistent_second_filler',
    );
    await changeTab(page, 'Selected');
    await page.locator('canvas').nth(1).click({
        position:
            CANVAS_ELEMENT_POSITIONS['new_folder/persistent_second_filler'][
                'Rabbit Inc'
            ],
    });
    // Expect that table cells have a max height that hides the majority of the
    // text such that you can still see elements below the properties, such as
    // Direct Connections.
    await expect(page.getByText('Connections')).toBeVisible();
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
    await changeTab(page, 'Styling');
    await fillInStyling(page, { colourValue: 'BD10E0', size: 30 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(3000);
    expect(await page.screenshot()).toMatchSnapshot(
        'node-colour-size-change.png',
    );
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
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
    await changeTab(page, 'Styling');
    await page.waitForTimeout(100);
    await page.getByText('Select Edge Layer').click();
    await page.getByRole('option', { name: 'advises' }).click();
    await fillInStyling(page, { colourValue: 'F5A623' });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await openTimeline(page);
    await page.waitForTimeout(5000);
    expect(await page.screenshot()).toMatchSnapshot(
        'edge-colour-change-layer-dropdown.png',
    );
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2000);
});

test('Change colour and size of node by type', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'persistent');
    await fitView(page);

    // This will fail if the server has not been restarted in between test runs,
    // or if bugs cause the reset at the end of these style tests to not work.
    expect(await page.screenshot()).toMatchSnapshot(
        'vanilla-persistent-base-graph.png',
    );

    await changeTab(page, 'Styling');
    await page.getByText('Select Node Type').click();
    await page.getByRole('option', { name: 'Person' }).click();
    await fillInStyling(page, { colourValue: 'D0021B', size: 30 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(2000);
    expect(await page.screenshot()).toMatchSnapshot(
        'node-type-colour-size-change.png',
    );
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2000);
});

test('Preview colour and size by type changes', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'second_filler',
    );
    await fitView(page);
    await changeTab(page, 'Styling');
    await page.getByText('Select Node Type').click();
    await page.getByRole('option', { name: 'Person' }).click();
    await fillInStyling(page, { colourValue: 'D0021B', size: 30 });
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
    await changeTab(page, 'Styling');
    await fillInStyling(page, { colourValue: 'BD10E0', size: 30 });
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
    await changeTab(page, 'Styling');
    await page.getByText('Select Edge Layer').click();
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
    await openTimeline(page);
    // Wait for the timeline to open fully
    await page.waitForTimeout(500);
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
        .getByRole('button', { name: 'Apply Layout', exact: true })
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

    await page.getByRole('checkbox', { name: 'Clockwise' }).check();
    await page.getByRole('checkbox', { name: 'Equidistant rings' }).check();
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
        .getByRole('button', { name: 'Apply Layout', exact: true })
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

    await page.getByText('Default Layout').click();
    await page.getByRole('option', { name: 'Concentric Layout' }).click();

    await page.getByRole('checkbox', { name: 'Clockwise' }).check();
    await page.getByRole('checkbox', { name: 'Equidistant rings' }).check();
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
        .getByRole('button', { name: 'Apply Layout', exact: true })
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

    await page.getByText('Concentric Layout').click();
    await page.getByRole('option', { name: 'Hierarchical TD Layout' }).click();

    await page.getByRole('checkbox', { name: 'Invert direction' }).check();
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
    // Needed to make the dragSlider work
    await page.getByLabel('Size of node').click();
    await dragSlider({
        page,
        slider: page.getByLabel('Size of node'),
        root: page.getByLabel('Node size Slider Container'),
        sliderPosition: 0.5,
    });
    await page.getByRole('checkbox', { name: 'Control points' }).check();
    await page
        .getByRole('button', { name: 'Apply Layout', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'layout-customizer-prelayout-dagre-all-changed.png',
    );
});

test('Brush select on main canvas works from first click', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );

    await page.keyboard.down('Shift');
    await page.mouse.move(630, 100);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(120, 330);
    await page.mouse.up();
    await page.keyboard.up('Shift');

    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'brush-select-first-click.png',
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
