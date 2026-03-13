import { expect, Locator, Page } from '@playwright/test';

interface G6NodeData {
    id: string;
    displayName: string;
    states?: string[];
    style?: {
        fill?: string;
        size?: number;
    };
}
interface G6EdgeData {
    id?: string;
    source: string;
    target: string;
}
type BrowserWindow = Window & {
    __TESTING_ENABLED__?: boolean;
    __G6_GRAPH__?: {
        getData(): { nodes: G6NodeData[]; edges: G6EdgeData[] };
        getElementPosition(id: string): [number, number];
        getViewportByCanvas(point: [number, number]): [number, number];
    };
};

async function getNodePosition(
    page: Page,
    displayName: string,
): Promise<{ x: number; y: number }> {
    await page.waitForFunction(
        (name) => {
            const graph = (window as BrowserWindow).__G6_GRAPH__;
            return !!(
                graph &&
                graph.getData().nodes.some((n) => n.displayName === name)
            );
        },
        displayName,
        { timeout: 10000 },
    );

    const position = await page.evaluate((name) => {
        const graph = (window as BrowserWindow).__G6_GRAPH__;
        const node = graph?.getData().nodes.find((n) => n.displayName === name);
        if (!node || !graph) return null;
        const canvasPoint = graph.getElementPosition(node.id);
        const vp = graph.getViewportByCanvas(canvasPoint);
        return { x: vp[0], y: vp[1] };
    }, displayName);
    if (!position) {
        throw new Error(
            `Failed to get canvas position for node "${displayName}"`,
        );
    }
    return position;
}

export async function clickOnNode(
    page: Page,
    displayName: string,
    options?: { modifiers?: ('Shift' | 'Control' | 'Meta' | 'Alt')[] },
) {
    const position = await getNodePosition(page, displayName);
    await page
        .locator('canvas')
        .nth(1)
        .click({ position, modifiers: options?.modifiers });
}

export async function doubleClickOnNode(page: Page, displayName: string) {
    const position = await getNodePosition(page, displayName);
    await page.locator('canvas').nth(1).dblclick({ position });
}

/** Click the first node normally, then Shift-click the rest to multi-select. */
export async function clickOnNodes(page: Page, displayNames: string[]) {
    if (displayNames.length === 0) return;
    await clickOnNode(page, displayNames[0]);
    for (const name of displayNames.slice(1)) {
        await clickOnNode(page, name, { modifiers: ['Shift'] });
    }
}

/** Click the midpoint of an edge identified by its src and dst node display names. */
export async function clickOnEdge(
    page: Page,
    srcDisplayName: string,
    dstDisplayName: string,
    options?: { modifiers?: ('Shift' | 'Control' | 'Meta' | 'Alt')[] },
) {
    const [src, dst] = await Promise.all([
        getNodePosition(page, srcDisplayName),
        getNodePosition(page, dstDisplayName),
    ]);
    const position = { x: (src.x + dst.x) / 2, y: (src.y + dst.y) / 2 };
    await page
        .locator('canvas')
        .nth(1)
        .click({ position, modifiers: options?.modifiers });
}

export async function fillInCondition(
    page: Page,
    condition: {
        op?: { current: string; new: string };
        value?: string;
    },
) {
    if (condition.op !== undefined) {
        await page.getByText(condition.op.current).click();
        await expect(
            page.getByRole('option', { name: condition.op.new }),
        ).toBeVisible();
        await page.getByRole('option', { name: condition.op.new }).click();
        // Wait for condition dropdown to close
        await expect(page.locator('.MuiMenu-root')).toBeHidden();
        await expect(page.getByText(condition.op.new)).toBeVisible();
    }
    if (condition.value !== undefined) {
        const input = page.getByPlaceholder('Value');
        await input.focus();
        await input.fill(condition.value);
        await input.blur();
        await page.waitForTimeout(1000); // This timeout can help tests be more stable
    }
}

export async function searchForEntity(
    page: Page,
    entity:
        | {
              type: 'node';
              nodeType: string;
              conditions?: {
                  name: string;
                  op?: { current: string; new: string };
                  value?: string;
              }[];
          }
        | {
              type: 'edge';
              src?: string;
              dst?: string;
              layers?: string[];
          },
) {
    await page.goto('/search');
    await page
        .getByRole('button', {
            name: 'Select a graph',
        })
        .click();
    await page.waitForSelector('text="vanilla"');
    await page.getByRole('row', { name: /^vanilla$/ }).click();
    await page.waitForSelector('text="event"');
    await page.getByRole('row', { name: /^event$/ }).click();
    await page
        .getByRole('button', {
            name: 'Confirm',
        })
        .click();
    if (entity.type === 'node') {
        await page.getByRole('combobox', { name: 'Select type' }).click();
        await page.getByRole('option', { name: entity.nodeType }).click();
        await expect(page.getByText(entity.nodeType).first()).toBeVisible();
        for (const condition of entity.conditions ?? []) {
            await page.getByRole('button', { name: 'Add' }).click();
            await page.getByRole('menuitem', { name: condition.name }).click();
            await fillInCondition(page, condition);
        }
    } else if (entity.type === 'edge') {
        await page.getByRole('combobox').filter({ hasText: 'Entity' }).click();
        await page.getByRole('option', { name: 'Relationship' }).click();
        if (entity.src !== undefined) {
            await page.getByRole('textbox', { name: 'Source ID' }).click();
            await page
                .getByRole('textbox', { name: 'Source ID' })
                .fill(entity.src);
        }
        if (entity.dst !== undefined) {
            await page.getByRole('textbox', { name: 'Destination ID' }).click();
            await page
                .getByRole('textbox', { name: 'Destination ID' })
                .fill(entity.dst);
        }
        for (const layer of entity.layers ?? []) {
            await page.getByRole('combobox', { name: 'Layers' }).click();
            await page.getByRole('option', { name: layer }).click();
        }
    }
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Start Your Search')).toBeHidden();
    await expect(page.getByRole('progressbar')).toBeHidden();
}

export async function navigateToGraphPageBySearch(
    page: Page,
    entity:
        | {
              type: 'node';
              nodeName: string;
              nodeType: string;
          }
        | {
              type: 'edge';
              src: string;
              dst: string;
              layers: string[];
          },
) {
    await searchForEntity(page, entity);

    if (entity.type === 'node') {
        if (entity.nodeType === 'Person') {
            await page
                .getByRole('button', {
                    name: `${entity.nodeName} PERSON Age`,
                })
                .dblclick();
        } else if (entity.nodeType === 'Company') {
            await page
                .getByRole('button', {
                    name: `${entity.nodeName} COMPANY ID: ${entity.nodeName}`,
                })
                .dblclick();
        } else if (entity.nodeType === 'None') {
            await page
                .getByRole('button', {
                    name: `${entity.nodeName} ID: ${entity.nodeName}`,
                })
                .dblclick();
        }
    } else if (entity.type === 'edge') {
        await page
            .getByRole('button', {
                name: `${entity.src} - ${entity.dst} EDGE ${entity.layers.join('·')}`,
            })
            .dblclick();
    }

    await waitForLayoutToFinish(page);
}

export async function clickSavedGraphsGraph(page: Page, graphName: string) {
    await page
        .getByRole('button', { name: new RegExp(`^${graphName} GRAPH`) })
        .click();
}

export async function clickSavedGraphsFolder(page: Page, folderName: string) {
    await page
        .getByRole('button', {
            name: new RegExp(`^${folderName} FOLDER Click to browse`),
        })
        .click();
}

export async function navigateToSavedGraphBySavedGraphsTable(
    page: Page,
    folderName: string,
    graphName: string,
) {
    await page.goto('/saved-graphs');
    await clickSavedGraphsFolder(page, folderName);
    await clickSavedGraphsGraph(page, graphName);
    await page.getByRole('link', { name: 'Open' }).click();
    await waitForLayoutToFinish(page);
}

export async function selectLayout(
    page: Page,
    layoutName: string,
    layoutTimeout?: number,
) {
    await page.getByRole('button', { name: 'Layout' }).click();
    await page
        .getByRole('menuitem', {
            name: layoutName,
            exact: true,
        })
        .click();
    await waitForLayoutToFinish(page, undefined, layoutTimeout);
}

export async function waitForLayoutToFinish(
    page: Page,
    queryTimeout?: number,
    layoutTimeout?: number,
) {
    await expect(
        page.getByRole('progressbar', { name: 'Querying for graph...' }),
    ).toBeHidden({
        timeout: queryTimeout,
    });
    await expect(
        page.getByRole('progressbar', { name: 'Computing layout...' }),
    ).toBeHidden({
        timeout: layoutTimeout,
    });
    // this extra timeout is to account for the animation
    await page.waitForTimeout(2000);
}

export async function openTimeline(page: Page) {
    await page.getByRole('button', { name: 'Open timeline' }).click();
    // wait for animation to finish
    await page.waitForTimeout(300);
}

export async function dragSlider({
    page,
    slider,
    root,
    sliderPosition,
}: {
    page: Page;
    slider: Locator;
    root: Locator;
    sliderPosition: number;
}) {
    const rootOffsetWidth = (await root.boundingBox())?.width;
    if (rootOffsetWidth === undefined) {
        throw Error('Could not get slider root offset!');
    }
    if (sliderPosition < 0 || sliderPosition > 1) {
        throw Error(
            'Provide a position to drag the slider to between 0 and 1.',
        );
    }
    await slider.dragTo(root, {
        force: true,
        targetPosition: { x: rootOffsetWidth * sliderPosition, y: 0 },
    });
    await slider.dragTo(root, {
        force: true,
        targetPosition: { x: rootOffsetWidth * sliderPosition, y: 0 },
    });
    // sometimes the slider label stays and blocks elements below it, this tries
    // to make it go away
    await page.mouse.move(0, 0);
}

export async function toggleAccordion(page: Page, name: string) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.waitForTimeout(500); // Accordion animation
}

// Assumes you have RHS open and are on the styling tab of a particular entity
// (i.e. that entity is selected already or you are editing the styles of a node type)
export async function fillInStyling(
    page: Page,
    { colourValue, size }: { colourValue?: string; size?: number },
) {
    // in Chromium, the input needs to be cleared first or it will append the
    // value to the end of the existing value, which will then be ignored.
    if (colourValue !== undefined) {
        const colourInput = page
            .locator('div')
            .filter({ hasText: /^Hex$/ })
            .getByRole('textbox');
        await colourInput.click();
        await colourInput.fill('');
        await colourInput.fill(colourValue);
    }

    if (size !== undefined) {
        const sizeInput = page.getByPlaceholder('Enter size');
        await sizeInput.fill('');
        await sizeInput.fill(size.toString());
    }
}

interface GraphState {
    selected: string[];
    nodes: {
        id: string;
        colour: string | undefined;
        size: number | undefined;
    }[];
}

export async function getGraphState(page: Page): Promise<GraphState> {
    return page.evaluate(() => {
        const graph = (window as BrowserWindow).__G6_GRAPH__;
        if (!graph) throw new Error('__G6_GRAPH__ not found on window');
        const data = graph.getData();
        return {
            selected: data.nodes
                .filter((n) => n.states?.includes('selected'))
                .map((n) => n.id),
            nodes: data.nodes.map((n) => ({
                id: n.id,
                colour: n.style?.fill,
                size: n.style?.size,
            })),
        };
    });
}
