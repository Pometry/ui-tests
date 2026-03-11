import { expect, Page } from '@playwright/test';
import { test } from '../fixtures';
import {
    clickOnEdge,
    clickOnNode,
    clickOnNodes,
    doubleClickOnNode,
    dragSlider,
    fillInStyling,
    getAppState,
    getGraphNodeIds,
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
    await page.getByText('Relationships').waitFor();
    await page
        .getByText('transfers3')
        .getByRole('button', { name: 'Highlight on graph' })
        .click();
    await waitForLayoutToFinish(page);
    const transferState = await getAppState(page);
    expect(transferState?.highlighted?.layer).toEqual('transfers');
    await page
        .getByText('founds2')
        .getByRole('button', { name: 'Highlight on graph' })
        .click();
    await waitForLayoutToFinish(page);
    const foundState = await getAppState(page);
    expect(foundState?.highlighted?.layer).toEqual('founds');
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
    await clickOnNode(page, 'Pometry');
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
    await clickOnNode(page, 'Pedro');
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
    await clickOnNode(page, 'Hamza');
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
    await clickOnNode(page, 'Ben');
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
    await clickOnNode(page, 'Pedro');
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
    await expect(page.getByRole('heading', { name: 'Pedro' })).toBeHidden();
    await changeTab(page, 'Overview');
    await page.getByRole('button', { name: 'Undo (⌘Z)', exact: true }).click();

    await waitForLayoutToFinish(page);
    await doubleClickOnNode(page, 'Pedro');
    await waitForLayoutToFinish(page);
    expect(await getGraphNodeIds(page)).toEqual(['Pedro', 'Ben', 'Hamza']);
});

test('Expand node by floating actions button', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });

    await clickOnNode(page, 'Pedro');
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
    expect(await getGraphNodeIds(page)).toEqual(['Pedro', 'Ben', 'Hamza']);
});

test('Expand two-hop by floating actions button', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });

    await clickOnNode(page, 'Pedro');
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
    expect(await getGraphNodeIds(page)).toEqual([
        'Pedro',
        'Ben',
        'Hamza',
        'Pometry',
    ]);
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

    await clickOnNodes(page, ['Hamza', 'Pedro']);
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
    expect(await getGraphNodeIds(page)).toEqual(['Pedro', 'Hamza', 'Ben']);
});

test('Click edge to reveal right hand side panel details', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });

    await doubleClickOnNode(page, 'Pedro');
    await waitForLayoutToFinish(page, 2000, 2000);
    await fitView(page);
    await clickOnEdge(page, 'Hamza', 'Pedro');
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
    await doubleClickOnNode(page, 'Pedro');
    await waitForLayoutToFinish(page);
    await page.getByRole('button', { name: 'Undo (⌘Z)', exact: true }).click();
    await waitForLayoutToFinish(page);
    await page.getByRole('button', { name: 'Redo (⌘⇧Z)', exact: true }).click();
    await waitForLayoutToFinish(page);
    expect(await getGraphNodeIds(page)).toHaveLength(3);
});

test('Expand node, fit view and select all similar nodes', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await waitForLayoutToFinish(page);
    await doubleClickOnNode(page, 'Pedro');
    await waitForLayoutToFinish(page);
    await fitView(page);
    await clickOnNode(page, 'Pedro');
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', {
            name: 'Select all nodes with the same type as selection',
        })
        .click();
    await waitForLayoutToFinish(page);
    const state = await getAppState(page);
    await expect(state?.selected).toHaveLength(3);
});

test('Click and deselect by floating actions', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await clickOnNode(page, 'Pedro');
    await changeTab(page, 'Selected');

    await expect(page.getByText('Pedro').nth(0)).toBeVisible();
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Clear current selection' })
        .click();
    await waitForLayoutToFinish(page);
    await expect(page.getByText('Pedro').nth(0)).toBeHidden();
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
    const state = await getAppState(page);
    await expect(state?.selected).toEqual([
        'None',
        'Pedro',
        'Ben',
        'Hamza',
        'Pometry',
    ]);
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Clear current selection', exact: true })
        .click();
    await waitForLayoutToFinish(page);
    const state2 = await getAppState(page);
    await expect(state2?.selected).toHaveLength(0);
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', {
            name: 'Select every node in the graph',
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page);
    const state3 = await getAppState(page);
    await expect(state3?.selected).toEqual([
        'None',
        'Pedro',
        'Ben',
        'Hamza',
        'Pometry',
    ]);
});

test('Click backspace to delete nodes', async ({ page }) => {
    await navigateToGraphPageBySearch(page, {
        type: 'node',
        nodeName: 'Pedro',
        nodeType: 'Person',
    });
    await doubleClickOnNode(page, 'Pedro');
    await selectLayout(page, 'Arrange nodes in concentric circles');
    await fitView(page);
    await waitForLayoutToFinish(page);
    expect(await getGraphNodeIds(page)).toHaveLength(3);
    await clickOnNode(page, 'Hamza');
    await page.keyboard.press('Backspace');
    await waitForLayoutToFinish(page);
    expect(await getGraphNodeIds(page)).toHaveLength(2);
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
    await clickOnNode(page, 'Rabbit Inc');
    // Expect that table cells have a max height that hides the majority of the
    // text such that you can still see elements below the properties, such as
    // Direct Connections.
    await expect(page.getByText('Connections')).toBeVisible();
});

test('Change colour and size of individual node', async ({ settingsPage }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        settingsPage,
        'new_folder',
        'persistent_filler',
    );
    await fitView(settingsPage);
    await clickOnNode(settingsPage, 'Pedro');
    await changeTab(settingsPage, 'Styling');
    await fillInStyling(settingsPage, { colourValue: 'BD10E0', size: 30 });
    await settingsPage
        .getByRole('button', { name: 'Save', exact: true })
        .click();
    await expect(settingsPage.getByText('Styling updated')).toBeVisible({
        timeout: 5000,
    });
    const state = await getAppState(settingsPage);
    await expect(state?.nodes.find((n) => n.id === 'Pedro')?.colour).toEqual(
        '#bd10e0',
    );
    await expect(state?.nodes.find((n) => n.id === 'Pedro')?.size).toEqual(30);
});

test('Change colour of edge by layer dropdown', async ({ settingsPage }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        settingsPage,
        'new_folder',
        'persistent_second_filler',
    );
    await fitView(settingsPage);

    await clickOnEdge(settingsPage, 'Judy', 'Rabbit Inc');
    await changeTab(settingsPage, 'Styling');
    await settingsPage.waitForTimeout(100);
    await settingsPage.getByText('Select Edge Layer').click();
    await settingsPage.getByRole('option', { name: 'advises' }).click();
    await fillInStyling(settingsPage, { colourValue: 'F5A623' });
    await settingsPage
        .getByRole('button', { name: 'Save', exact: true })
        .click();
    await expect(settingsPage.getByText('Styling updated')).toBeVisible({
        timeout: 5000,
    });
    await openTimeline(settingsPage);
    await settingsPage.waitForTimeout(5000);
    await expect(
        settingsPage
            .getByLabel('Edge ID Judy->RabbitInc_advises_100')
            .locator('path'),
    ).toHaveCSS('fill', 'rgb(245, 166, 35)');
});

test('Change colour and size of node by type', async ({ settingsPage }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        settingsPage,
        'vanilla',
        'persistent',
    );
    await fitView(settingsPage);

    // This will fail if for whatever reason the test data isn't in a clean
    // state before running tests.
    expect(await settingsPage.screenshot()).toMatchSnapshot(
        'vanilla-persistent-base-graph.png',
    );

    await changeTab(settingsPage, 'Styling');
    await settingsPage.getByText('Select Node Type').click();
    await settingsPage.getByRole('option', { name: 'Person' }).click();
    await fillInStyling(settingsPage, { colourValue: 'D0021B', size: 30 });
    await settingsPage
        .getByRole('button', { name: 'Save', exact: true })
        .click();
    await expect(settingsPage.getByText('Styling updated')).toBeVisible({
        timeout: 5000,
    });
    await settingsPage.waitForTimeout(2000);
    const state = await getAppState(settingsPage);
    await expect(state?.nodes.find((n) => n.id === 'Pedro')?.colour).toEqual(
        '#d0021b',
    );
    await expect(state?.nodes.find((n) => n.id === 'Pedro')?.size).toEqual(30);
    await expect(state?.nodes.find((n) => n.id === 'Hamza')?.colour).toEqual(
        '#d0021b',
    );
    await expect(state?.nodes.find((n) => n.id === 'Hamza')?.size).toEqual(30);
    await expect(state?.nodes.find((n) => n.id === 'Ben')?.colour).toEqual(
        '#d0021b',
    );
    await expect(state?.nodes.find((n) => n.id === 'Ben')?.size).toEqual(30);
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
    const state = await getAppState(page);
    expect(state?.nodes.find((n) => n.id === 'Fred')?.colour).toEqual(
        '#d0021b',
    );
    expect(state?.nodes.find((n) => n.id === 'Fred')?.size).toEqual(30);
});

test('Preview colour and size changes', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_filler',
    );
    await fitView(page);
    await clickOnNode(page, 'Ben');
    await changeTab(page, 'Styling');
    await fillInStyling(page, { colourValue: 'BD10E0', size: 30 });
    await page.waitForTimeout(1000);
    const state = await getAppState(page);
    expect(state?.nodes.find((n) => n.id === 'Ben')?.colour).toEqual('#bd10e0');
    expect(state?.nodes.find((n) => n.id === 'Ben')?.size).toEqual(30);
});

test('Preview edge colour changes', async ({ page }) => {
    await navigateToSavedGraphBySavedGraphsTable(
        page,
        'vanilla',
        'persistent_second_filler',
    );
    await fitView(page);

    await clickOnEdge(page, 'Judy', 'Rabbit Inc');
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
    await expect(
        page.getByLabel('Edge ID Judy->RabbitInc_advises_100').locator('path'),
    ).toHaveCSS('fill', 'rgb(245, 166, 35)');
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

    // TODO: make this into a reusable function for picking an option from a MUI dropdown like this (note this does not use timeouts)
    await page.getByText('Concentric Layout').click();
    await page.getByRole('option', { name: 'Hierarchical TD Layout' }).click();
    await page.locator('ul[role="listbox"]').waitFor({ state: 'detached' }); // wait for MUI Select portal to be fully removed from DOM (close animation completes)

    await page.getByRole('checkbox', { name: 'Invert direction' }).check();

    await page.getByRole('combobox', { name: 'Alignment' }).click();
    await page.getByRole('option', { name: 'Upper Right' }).click();
    await page.locator('ul[role="listbox"]').waitFor({ state: 'detached' });

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
    await page.getByRole('option', { name: 'tight-tree' }).click();
    await page.locator('ul[role="listbox"]').waitFor({ state: 'detached' });
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
    const state = await getAppState(page);
    await expect(state?.selected).toEqual(['None', 'Ben']);
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

test('Comprehensive styling, selection, and highlighting', async ({ page }) => {
    test.setTimeout(60000);
    await navigateToSavedGraphBySavedGraphsTable(page, 'vanilla', 'persistent');
    await fitView(page);

    // Temporary styling: preview Pedro's colour/size without saving
    await clickOnNode(page, 'Pedro');
    await changeTab(page, 'Styling');
    await fillInStyling(page, { colourValue: 'BD10E0', size: 25 });
    await page.waitForTimeout(1000);

    // Save individual node styling for Pedro
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Node style updated');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2000);

    // Edge styling by layer (preview): Pedro-Hamza edge, transfers layer
    await clickOnEdge(page, 'Pedro', 'Hamza');
    await changeTab(page, 'Styling');
    await page.waitForTimeout(100);
    await page.getByText('Select Edge Layer').click();
    await page.getByRole('option', { name: 'transfers' }).click();
    await fillInStyling(page, { colourValue: 'F5A623' });
    await page.waitForTimeout(1000);

    // Change node styling by type (Person)
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Clear current selection' })
        .click();
    await waitForLayoutToFinish(page);
    await changeTab(page, 'Styling');
    await page.getByText('Select Node Type').click();
    await page.getByRole('option', { name: 'Person' }).click();
    await fillInStyling(page, { colourValue: 'D0021B', size: 20 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(2000);

    // Select multiple nodes (Person type styling active)
    await clickOnNodes(page, ['Pedro', 'Ben', 'Hamza']);

    // Highlight a relationship layer from the Overview panel
    await changeTab(page, 'Overview');
    await page.getByText('Relationships').waitFor();
    await page
        .getByRole('button', { name: 'Highlight on graph' })
        .first()
        .click();
    await waitForLayoutToFinish(page);

    // Final screenshot: concentric layout with styled + selected nodes + highlighting
    await selectLayout(page, 'Arrange nodes in concentric circles');
    await fitView(page);
    await waitForLayoutToFinish(page);
    expect(await page.locator('canvas').nth(1).screenshot()).toMatchSnapshot(
        'comprehensive-styling-selecting-highlighting.png',
    );

    // Cleanup: reset Person type styling
    await page.getByRole('button', { name: 'Selection' }).click();
    await page
        .getByRole('menuitem', { name: 'Clear current selection' })
        .click();
    await waitForLayoutToFinish(page);
    await changeTab(page, 'Styling');
    await page.getByText('Select Node Type').click();
    await page.getByRole('option', { name: 'Person' }).click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(2000);
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
