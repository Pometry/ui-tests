import { expect, test } from '@playwright/test';

// ═════════════════════════════════════════════════════════════════════
// PLAYGROUND E2E TESTS
// ═════════════════════════════════════════════════════════════════════

/**
 * Navigate to the playground and ensure the Schema tab is loaded.
 */
async function waitForSchemaReady(page: import('@playwright/test').Page) {
    await page.goto('/playground');

    // Ensure the left panel is visible (might be collapsed via localStorage)
    const toggleBtn = page.getByTitle('Show panel');
    if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleBtn.click();
    }

    // Click the Schema tab
    await page
        .getByRole('tab', { name: /^Schema/ })
        .first()
        .click({ timeout: 10000 });

    // Wait for introspection to finish and a root-type chip to appear
    await expect(
        page.getByText('Connecting to server for schema introspection'),
    ).toBeHidden({ timeout: 15000 });
    await expect(
        page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: 'Query' }),
    ).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to the playground and open the Examples tab.
 */
async function openExamplesTab(page: import('@playwright/test').Page) {
    await page.goto('/playground');

    const toggleBtn = page.getByTitle('Show panel');
    if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleBtn.click();
    }

    await page.getByRole('tab', { name: 'Examples' }).click({ timeout: 10000 });
}

/**
 * Click a schema field by name (rendered inside ListItemButton).
 */
async function clickSchemaField(
    page: import('@playwright/test').Page,
    fieldName: string,
) {
    await page.getByRole('button', { name: fieldName }).first().click();
}

/**
 * Set variables JSON (opening the variables panel if needed).
 */
async function setVariablesContent(
    page: import('@playwright/test').Page,
    content: string,
) {
    const variablesEditor = page
        .getByLabel('Variables editor')
        .locator('.cm-content');
    if (!(await variablesEditor.isVisible().catch(() => false))) {
        await page.getByRole('button', { name: 'Variables' }).click();
        await expect(variablesEditor).toBeVisible();
    }
    await variablesEditor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(content, { delay: 5 });
}

// ─────────────────────────────────────────────────────────────────────
// Screenshot load-check (the only screenshot in the suite)
// ─────────────────────────────────────────────────────────────────────
test('Playground loads with Schema and Editor visible', async ({ page }) => {
    await waitForSchemaReady(page);

    await expect(
        page.getByPlaceholder('Search types and fields...'),
    ).toBeVisible();
    await expect(
        page.getByLabel('Query editor').locator('.cm-content'),
    ).toBeVisible();

    await expect(page).toHaveScreenshot('playground-loaded.png');
});

// ─────────────────────────────────────────────────────────────────────
// SCHEMA EXPLORER — Navigation & Breadcrumbs
// ─────────────────────────────────────────────────────────────────────
test.describe('Schema Explorer — Navigation', () => {
    test('navigate from Query into nested types and back via breadcrumbs', async ({
        page,
    }) => {
        await waitForSchemaReady(page);

        // Click Query chip → see its fields
        await page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: 'Query' })
            .click();
        await expect(
            page.getByText('graph', { exact: true }).first(),
        ).toBeVisible();

        // Click "graph" field → navigate to Graph type
        await clickSchemaField(page, 'graph');
        await expect(page.getByText('Graph').first()).toBeVisible();

        // Go deeper — click "nodes" field
        await clickSchemaField(page, 'nodes');

        // Breadcrumbs should show the nested type
        await expect(page.getByText('Query').first()).toBeVisible();

        // Click "Query" breadcrumb to go back
        await page.getByLabel('Schema breadcrumbs').getByText('Query').click();

        // Should be back at Query level with "graph" field visible
        await expect(
            page.getByText('graph', { exact: true }).first(),
        ).toBeVisible();
    });

    test('does not add the same type consecutively in breadcrumbs', async ({
        page,
    }) => {
        await waitForSchemaReady(page);

        // Navigate into Query → Graph
        await page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: 'Query' })
            .click();
        await clickSchemaField(page, 'graph');

        const chipsBefore = await page
            .getByLabel('Schema breadcrumbs')
            .locator('[class*="MuiChip"]')
            .count();

        // Search for "Graph" (the type we're already on) and click it
        const searchInput = page.getByPlaceholder('Search types and fields...');
        await searchInput.fill('Graph');
        await page.waitForTimeout(500);

        const graphResult = page
            .getByRole('option', { name: /^Graph$/ })
            .first();
        if (await graphResult.isVisible()) {
            await graphResult.click();
        }

        // Search field should be cleared
        await expect(searchInput).toHaveValue('');

        // Chip count should not have increased
        const chipsAfter = await page
            .getByLabel('Schema breadcrumbs')
            .locator('[class*="MuiChip"]')
            .count();
        expect(chipsAfter).toBeLessThanOrEqual(chipsBefore);
    });

    test('Mutation tab shows mutation fields', async ({ page }) => {
        await waitForSchemaReady(page);

        const mutationChip = page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: 'Mutation' });
        if (await mutationChip.isVisible()) {
            await mutationChip.click();
            await expect(page.getByRole('button').first()).toBeVisible();
        }
    });

    test('All Types tab lists types and navigating shows correct breadcrumbs', async ({
        page,
    }) => {
        await waitForSchemaReady(page);

        // Click "All Types"
        await page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: /All Types/ })
            .click();
        await expect(page.getByRole('button').first()).toBeVisible();

        // Click "Graph" from the list
        await page.getByRole('button', { name: 'Graph' }).first().click();

        // Breadcrumbs should contain All Types and Graph
        await expect(page.getByText('All Types').first()).toBeVisible();
        await expect(page.getByText('Graph').first()).toBeVisible();
    });

    test('union type shows member types', async ({ page }) => {
        await waitForSchemaReady(page);

        // Switch to All Types view
        await page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: /All Types/ })
            .first()
            .click();

        // Search for the union type specifically
        const searchInput = page.getByPlaceholder('Search types and fields...');
        await searchInput.fill('NamespacedItem');
        await page.waitForTimeout(500);

        // Click the exact NamespacedItem (not CollectionOfNamespacedItem)
        await page
            .getByRole('option', { name: /^NamespacedItem$/ })
            .first()
            .click();

        // Should now be viewing NamespacedItem — breadcrumb should show it
        await expect(page.getByText('NamespacedItem').first()).toBeVisible();

        // Union member types should be listed
        await expect(
            page.getByRole('button', { name: 'Namespace' }).first(),
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'MetaGraph' }).first(),
        ).toBeVisible();

        // Clicking a member type should navigate to it
        await page.getByRole('button', { name: 'Namespace' }).first().click();

        await expect(page.getByText('Namespace').first()).toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────────────
// SCHEMA EXPLORER — Search
// ─────────────────────────────────────────────────────────────────────
test.describe('Schema Explorer — Search', () => {
    test('search finds types and clicking a result updates breadcrumbs', async ({
        page,
    }) => {
        await waitForSchemaReady(page);

        const searchInput = page.getByPlaceholder('Search types and fields...');
        await searchInput.fill('Node');
        await page.waitForTimeout(500);

        // Results should appear
        await expect(page.getByRole('option').first()).toBeVisible();

        // Click the first result
        await page.getByRole('option').first().click();

        // Search should be cleared
        await expect(searchInput).toHaveValue('');
    });

    test('search for current type closes search but does not duplicate breadcrumb', async ({
        page,
    }) => {
        await waitForSchemaReady(page);

        // Navigate into Query → Graph
        await page
            .getByLabel('Schema root types')
            .getByRole('tab', { name: 'Query' })
            .click();
        await clickSchemaField(page, 'graph');

        const chipsBefore = await page
            .getByLabel('Schema breadcrumbs')
            .locator('[class*="MuiChip"]')
            .count();

        // Search for "Graph" and click it
        const searchInput = page.getByPlaceholder('Search types and fields...');
        await searchInput.fill('Graph');
        await page.waitForTimeout(500);

        const result = page.getByRole('option', { name: /^Graph$/ }).first();
        if (await result.isVisible()) {
            await result.click();
        }

        // Search must be cleared
        await expect(searchInput).toHaveValue('');

        // No extra breadcrumb chips
        const chipsAfter = await page
            .getByLabel('Schema breadcrumbs')
            .locator('[class*="MuiChip"]')
            .count();
        expect(chipsAfter).toBeLessThanOrEqual(chipsBefore);
    });
});

// ─────────────────────────────────────────────────────────────────────
// EXAMPLES — Navigation, Query Loading & Headers
// ─────────────────────────────────────────────────────────────────────
test.describe('Examples Panel', () => {
    test('navigate folders and load a query example', async ({ page }) => {
        await openExamplesTab(page);

        // See example folders
        await expect(page.getByText('Getting Started')).toBeVisible();

        // Enter "Getting Started"
        await page.getByRole('button', { name: 'Getting Started' }).click();

        // "Available Graphs" should be visible
        await expect(page.getByText('Available Graphs')).toBeVisible();

        // Click it → query loads into editor
        await page.getByRole('button', { name: 'Available Graphs' }).click();

        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toContainText('namespaces');
    });

    test('Data Mutations example sets headers', async ({ page }) => {
        await openExamplesTab(page);

        // Navigate to Data Mutations folder
        await page.getByRole('button', { name: 'Data Mutations' }).click();

        // Click "Add Node" (has Authorization header)
        await page.getByRole('button', { name: 'Add Node' }).first().click();

        // Open headers panel
        await page.getByRole('button', { name: 'Headers' }).click();

        await expect(page.getByLabel('Key').first()).toHaveValue(
            'Authorization',
        );
        await expect(page.getByLabel('Value').first()).toHaveValue(
            'Bearer <your-token>',
        );
    });
});

// ─────────────────────────────────────────────────────────────────────
// QUERY EXECUTION
// ─────────────────────────────────────────────────────────────────────
test.describe('Query Execution', () => {
    test('run Available Graphs and get results', async ({ page }) => {
        await openExamplesTab(page);

        await page.getByRole('button', { name: 'Getting Started' }).click();
        await page.getByRole('button', { name: 'Available Graphs' }).click();

        // Run query
        await page.getByRole('button', { name: /Run/ }).click();

        // Results should contain "data" and "namespaces"
        const resultEditor = page
            .getByLabel('Results editor')
            .locator('.cm-content');
        await expect(resultEditor).toContainText('data', { timeout: 15000 });
        await expect(resultEditor).toContainText('namespaces');
    });

    test('run query with variables and get correct results', async ({
        page,
    }) => {
        await openExamplesTab(page);

        // Load Graph Counts
        await page.getByRole('button', { name: 'Getting Started' }).click();
        await page.getByRole('button', { name: 'Graph Counts' }).click();

        // Update variables to use a real graph path
        await setVariablesContent(page, '{\n  "path": "vanilla/persistent"\n}');

        // Run query
        await page.getByRole('button', { name: /Run/ }).click();

        // Results should contain node/edge counts
        const resultEditor = page
            .getByLabel('Results editor')
            .locator('.cm-content');
        await expect(resultEditor).toContainText('count', { timeout: 15000 });
        const resultText = await resultEditor.textContent();
        expect(resultText).toContain('nodes');
        expect(resultText).toContain('edges');
    });
});

// ─────────────────────────────────────────────────────────────────────
// REGRESSION: Integer truncation on large timestamps
// ─────────────────────────────────────────────────────────────────────
test.describe('Regression Tests', () => {
    test('latestTime timestamp is not truncated (integer precision)', async ({
        page,
    }) => {
        await page.goto('/playground');

        // Wait for editor to be ready
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Focus editor and select everything using End/Home shortcuts
        // (Cmd+A can be unreliable in webkit CodeMirror with long content)
        const editor = page.getByLabel('Query editor').locator('.cm-content');
        await editor.click();
        await page.waitForTimeout(300);

        // Move to document end, then select all back to start
        await page.keyboard.press('ControlOrMeta+End');
        await page.keyboard.press('ControlOrMeta+Shift+Home');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(200);

        // Verify editor is empty-ish, then type
        await page.keyboard.type(
            '{ graph(path:"vanilla/persistent") { latestTime { timestamp } } }',
            { delay: 5 },
        );

        // Run query
        await page.getByRole('button', { name: /Run/ }).click();

        // Verify exact timestamp value in results
        const resultEditor = page
            .getByLabel('Results editor')
            .locator('.cm-content');
        await expect(resultEditor).toContainText('timestamp', {
            timeout: 15000,
        });
        const resultText = await resultEditor.textContent();
        expect(resultText).toContain('1710115200000');
    });
});

// ─────────────────────────────────────────────────────────────────────
// SCHEMA PANEL — Open & Close
// ─────────────────────────────────────────────────────────────────────
test.describe('Schema Panel Toggle', () => {
    test('schema panel can be opened and closed', async ({ page }) => {
        await waitForSchemaReady(page);

        // Panel should be open — Schema tab content is visible
        await expect(
            page.getByPlaceholder('Search types and fields...'),
        ).toBeVisible();

        // Close the panel via the ◀ button
        await page.getByTitle('Hide panel').click();

        // Schema content should now be hidden
        await expect(
            page.getByPlaceholder('Search types and fields...'),
        ).toBeHidden();

        // Reopen the panel via the ▶ button
        await page.getByTitle('Show panel').click();

        // Schema content should be visible again
        await expect(
            page.getByPlaceholder('Search types and fields...'),
        ).toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────────────
// PANEL RESIZING
// ─────────────────────────────────────────────────────────────────────
test.describe('Panel Resizing', () => {
    test('all three panels are resizable via drag handles', async ({
        page,
    }) => {
        await waitForSchemaReady(page);

        const colResizeCount = await page.evaluate(() => {
            return document.querySelectorAll('[role="separator"]').length;
        });
        expect(colResizeCount).toBeGreaterThanOrEqual(2);

        // Get the bounding box of the left panel before resize
        const schemaPanelBefore = await page
            .getByRole('tab', { name: /^Schema/ })
            .first()
            .boundingBox();

        // Find the first separator element and drag it
        const firstSeparator = await page.evaluate(() => {
            const separators = document.querySelectorAll('[role="separator"]');
            if (separators.length > 0) {
                const rect = separators[0].getBoundingClientRect();
                return {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2,
                };
            }
            return null;
        });

        if (firstSeparator) {
            // Drag right by 50px
            await page.mouse.move(firstSeparator.x, firstSeparator.y);
            await page.mouse.down();
            await page.mouse.move(firstSeparator.x + 50, firstSeparator.y, {
                steps: 5,
            });
            await page.mouse.up();

            // Verify the panel size changed
            const schemaPanelAfter = await page
                .getByRole('tab', { name: /^Schema/ })
                .first()
                .boundingBox();
            if (schemaPanelBefore && schemaPanelAfter) {
                expect(schemaPanelAfter.width).not.toBe(
                    schemaPanelBefore.width,
                );
            }
        }
    });
});

// ─────────────────────────────────────────────────────────────────────
// CODE FOLDING — Query and Results
// ─────────────────────────────────────────────────────────────────────
test.describe('Code Folding', () => {
    test('query editor supports folding and unfolding code blocks', async ({
        page,
    }) => {
        await openExamplesTab(page);

        // Load a query with nested curly brackets
        await page.getByRole('button', { name: 'Getting Started' }).click();
        await page.getByRole('button', { name: 'Available Graphs' }).click();

        // Run the query first to get results with foldable content
        await page.getByRole('button', { name: /Run/ }).click();
        const resultEditor = page
            .getByLabel('Results editor')
            .locator('.cm-content');
        await expect(resultEditor).toContainText('data', { timeout: 15000 });

        // CodeMirror fold gutters should be visible (⌄ markers)
        const foldGutters = page.locator('.cm-foldGutter .cm-gutterElement');
        const foldCount = await foldGutters.count();
        expect(foldCount).toBeGreaterThan(0);

        // Click a fold gutter to collapse a block
        // Find a gutter element with the fold indicator
        const foldMarker = foldGutters.filter({ hasText: '⌄' }).first();
        if (await foldMarker.isVisible()) {
            await foldMarker.click();

            // After folding, a "…" placeholder should appear
            await expect(
                page.locator('.cm-foldPlaceholder').first(),
            ).toBeVisible({ timeout: 3000 });

            // Click the placeholder to unfold
            await page.locator('.cm-foldPlaceholder').first().click();

            // Placeholder should be gone
            await page.waitForTimeout(300);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────
// TAB MANAGEMENT — Add, Remove, Scroll
// ─────────────────────────────────────────────────────────────────────
test.describe('Tab Management', () => {
    test('can add and remove query tabs', async ({ page }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Initially should have the default "Query" tab
        const defaultTab = page.getByText('Query', { exact: true }).first();
        await expect(defaultTab).toBeVisible();

        // Add a new tab
        await page.getByLabel('Add tab').click();
        await page.waitForTimeout(300);

        // Should now have 2 tabs — close button (✕) should be visible
        const closeButtons = page.getByLabel(/^Close /);
        expect(await closeButtons.count()).toBeGreaterThanOrEqual(2);

        // Close the new tab
        await closeButtons.last().click();
        await page.waitForTimeout(300);

        // Should be back to 1 tab — close button hidden when only 1 tab
        expect(await closeButtons.count()).toBeLessThanOrEqual(1);
    });

    test('tabs scroll horizontally without visible scrollbar', async ({
        page,
    }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Add multiple tabs to force overflow
        for (let i = 0; i < 8; i++) {
            await page.getByLabel('Add tab').click();
            await page.waitForTimeout(150);
        }

        // The tab container should have scrollbar hidden via CSS
        const scrollbarHidden = await page.evaluate(() => {
            const stacks = document.querySelectorAll('[class*="MuiStack"]');
            for (const stack of stacks) {
                const style = window.getComputedStyle(stack);
                if (
                    style.overflowX === 'auto' &&
                    style.scrollbarWidth === 'none'
                ) {
                    return true;
                }
            }
            return false;
        });
        expect(scrollbarHidden).toBe(true);

        // Tabs behind headers/variables area should scroll
        // Verify the tab bar has overflow by checking scrollWidth > clientWidth
        const hasOverflow = await page.evaluate(() => {
            const stacks = document.querySelectorAll('[class*="MuiStack"]');
            for (const stack of stacks) {
                const style = window.getComputedStyle(stack);
                if (
                    style.overflowX === 'auto' &&
                    (stack as HTMLElement).scrollWidth >
                        (stack as HTMLElement).clientWidth
                ) {
                    return true;
                }
            }
            return false;
        });
        expect(hasOverflow).toBe(true);

        // Clean up — close extra tabs
        while ((await page.getByLabel(/^Close /).count()) > 1) {
            await page
                .getByLabel(/^Close /)
                .last()
                .click();
            await page.waitForTimeout(100);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────
// RUN BUTTON & KEYBOARD SHORTCUT
// ─────────────────────────────────────────────────────────────────────
test.describe('Run Query Methods', () => {
    test('Cmd/Ctrl+Enter runs the query', async ({ page }) => {
        await openExamplesTab(page);

        // Load "Available Graphs" example
        await page.getByRole('button', { name: 'Getting Started' }).click();
        await page.getByRole('button', { name: 'Available Graphs' }).click();

        // Focus the query editor so the keymap fires
        await page.getByLabel('Query editor').locator('.cm-content').click();

        // Press Cmd+Enter (Mac) or Ctrl+Enter
        await page.keyboard.press('ControlOrMeta+Enter');

        // Results should appear
        const resultEditor = page
            .getByLabel('Results editor')
            .locator('.cm-content');
        await expect(resultEditor).toContainText('data', { timeout: 15000 });
        await expect(resultEditor).toContainText('namespaces');
    });
});

// ─────────────────────────────────────────────────────────────────────
// HEADERS & VARIABLES TOGGLE
// ─────────────────────────────────────────────────────────────────────
test.describe('Headers & Variables Panel', () => {
    test('Headers button toggles the headers panel', async ({ page }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        const headersBtn = page.getByRole('button', { name: 'Headers' });

        // Click to open headers
        await headersBtn.click();

        // The "+ Add Header" button should be visible
        await expect(
            page.getByRole('button', { name: '+ Add Header' }),
        ).toBeVisible({ timeout: 3000 });

        // Click "+ Add Header" to add a row
        await page.getByRole('button', { name: '+ Add Header' }).click();

        await expect(
            page.getByPlaceholder('e.g. Authorization').first(),
        ).toBeVisible();

        // Click headers button again to close
        await headersBtn.click();
        await page.waitForTimeout(300);

        await expect(
            page.getByPlaceholder('e.g. Authorization').first(),
        ).toBeHidden();
    });

    test('Variables button toggles the variables panel', async ({ page }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        const variablesBtn = page.getByRole('button', { name: 'Variables' });

        // Initially the variables editor (second cm-content) is hidden
        const variablesEditor = page
            .getByLabel('Variables editor')
            .locator('.cm-content');

        // Click to open variables
        await variablesBtn.click();
        await expect(variablesEditor).toBeVisible({ timeout: 3000 });

        // Click again to close
        await variablesBtn.click();
        await page.waitForTimeout(300);
        await expect(variablesEditor).toBeHidden();
    });

    test('query with both headers and variables works', async ({ page }) => {
        await openExamplesTab(page);

        // Navigate to Getting Started folder (unambiguous name)
        await page.getByRole('button', { name: 'Getting Started' }).click();

        // Click "Graph Counts" (has variables, returns node data)
        await page.getByRole('button', { name: 'Graph Counts' }).click();

        // Update variables to use a real graph path
        await setVariablesContent(page, '{\n  "path": "vanilla/persistent"\n}');

        // Add a header manually to test headers + variables together
        await page.getByRole('button', { name: 'Headers' }).click();
        await page.getByRole('button', { name: '+ Add Header' }).click();
        await page.waitForTimeout(300);
        const keyInput = page.getByLabel('Key').first();
        await keyInput.click();
        await keyInput.pressSequentially('X-Custom');

        // Run the query
        await page.getByRole('button', { name: /Run/ }).click();

        // Results should contain node/edge count data
        const resultEditor = page
            .getByLabel('Results editor')
            .locator('.cm-content');
        await expect(resultEditor).toContainText('data', { timeout: 15000 });
        await expect(resultEditor).toContainText('nodes');
    });
});

// ─────────────────────────────────────────────────────────────────────
// PRETTIFY BUTTON
// ─────────────────────────────────────────────────────────────────────
test.describe('Prettify Button', () => {
    test('prettify button formats the query', async ({ page }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Type an unformatted single-line query
        const editor = page.getByLabel('Query editor').locator('.cm-content');
        await editor.click();
        await page.waitForTimeout(300);
        await page.keyboard.press('ControlOrMeta+End');
        await page.keyboard.press('ControlOrMeta+Shift+Home');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(200);
        await page.keyboard.type('{ graph(path:"test") { nodes { count } } }', {
            delay: 5,
        });

        // Get the text before prettify (should be one line)
        const textBefore = await editor.textContent();

        // Click the prettify button (✨)
        await page.getByTitle('Prettify query').click();
        await page.waitForTimeout(500);

        // The formatted text should have more lines (indented with newlines)
        const textAfter = await editor.textContent();
        expect(textAfter).not.toBe(textBefore);
        // Prettified version should still contain the query content
        expect(textAfter).toContain('graph');
        expect(textAfter).toContain('nodes');
        expect(textAfter).toContain('count');
    });
});

// ─────────────────────────────────────────────────────────────────────
// PERSISTENCE — Tabs & queries survive page refresh
// ─────────────────────────────────────────────────────────────────────
test.describe('Persistence', () => {
    test('tabs and query content persist after page refresh', async ({
        page,
    }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Add a second tab
        await page.getByLabel('Add tab').click();
        await page.waitForTimeout(300);

        // Load a known query into the second tab via an example
        // Open Examples tab in left panel
        const toggleBtn = page.getByTitle('Show panel');
        if (await toggleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await toggleBtn.click();
        }
        await page
            .getByRole('tab', { name: 'Examples' })
            .click({ timeout: 5000 });
        await page.getByRole('button', { name: 'Getting Started' }).click();
        await page.getByRole('button', { name: 'Available Graphs' }).click();

        // Verify the editor has the namespaces query
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toContainText('namespaces');

        // Count the tabs before refresh
        const tabsBefore = await page.getByLabel(/^Close /).count();
        expect(tabsBefore).toBeGreaterThanOrEqual(2);

        // Refresh the page
        await page.reload();
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Tabs should still be present (close buttons still visible)
        const tabsAfter = await page.getByLabel(/^Close /).count();
        expect(tabsAfter).toBe(tabsBefore);

        // The active tab's query should still contain "namespaces"
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toContainText('namespaces');
    });
});

// ─────────────────────────────────────────────────────────────────────
// TAB RENAME — Double-click to rename, persists after refresh
// ─────────────────────────────────────────────────────────────────────
test.describe('Tab Rename', () => {
    test('double-click renames a tab and name persists after refresh', async ({
        page,
    }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // Default tab should be called "Query"
        const tabText = page
            .getByLabel('Query tabs')
            .getByRole('tab', { name: 'Query' });
        await expect(tabText).toBeVisible();

        // Double-click the tab to start rename
        await tabText.dblclick();

        // An input should appear with the current title
        const renameInput = page.getByLabel('Rename tab');
        await expect(renameInput).toBeVisible({ timeout: 3000 });

        // Clear and type new name
        await renameInput.fill('My Custom Query');
        await renameInput.press('Enter');

        // Verify the new name is shown
        await expect(
            page
                .getByLabel('Query tabs')
                .getByRole('tab', { name: 'My Custom Query' }),
        ).toBeVisible();

        // Refresh the page
        await page.reload();
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // The renamed tab should still be there
        await expect(
            page
                .getByLabel('Query tabs')
                .getByRole('tab', { name: 'My Custom Query' }),
        ).toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────────────
// TAB-SCOPED STATE — Headers & Variables are per-tab
// ─────────────────────────────────────────────────────────────────────
test.describe('Tab-Scoped State', () => {
    test('headers and variables are local to each tab', async ({ page }) => {
        await page.goto('/playground');
        await expect(
            page.getByLabel('Query editor').locator('.cm-content'),
        ).toBeVisible({
            timeout: 10000,
        });

        // === Tab 1: set a header and variable ===
        // Open headers panel and add a header
        await page.getByRole('button', { name: 'Headers' }).click();
        await page.getByRole('button', { name: '+ Add Header' }).click();
        await page.waitForTimeout(300);

        // Use getByLabel for MUI TextFields and pressSequentially for reliable onChange
        const keyInput = page.getByLabel('Key').first();
        await keyInput.click();
        await keyInput.pressSequentially('X-Test-Header');

        const valInput = page.getByLabel('Value').first();
        await valInput.click();
        await valInput.pressSequentially('test-value-tab1');

        // Open variables panel and type some variables
        await page.getByRole('button', { name: 'Variables' }).click();
        await setVariablesContent(page, '{ "tab": 1 }');

        // Verify headers were actually set before creating new tab
        await expect(page.getByLabel('Key').first()).toHaveValue(
            'X-Test-Header',
            { timeout: 3000 },
        );

        // === Create Tab 2 ===
        await page.getByLabel('Add tab').click();
        await page.waitForTimeout(500);

        // Tab 2 is now active — headers panel is still open but shows Tab 2's state
        // Tab 2 should have NO header rows (just "+ Add Header")
        const tab2HeaderInputs = page.getByLabel('Key');
        expect(await tab2HeaderInputs.count()).toBe(0);

        // Variables panel: Tab 2 should NOT have Tab 1's variables
        const variablesEditor = page
            .getByLabel('Variables editor')
            .locator('.cm-content');
        if (await variablesEditor.isVisible().catch(() => false)) {
            const varText = await variablesEditor.textContent();
            expect(varText).not.toContain('"tab": 1');
        }

        // === Switch back to Tab 1 and verify its state is preserved ===
        // Use locator that targets the tab's paragraph text next to a ✕ close button
        // (avoid matching Schema panel's "Query" button)
        const tab1 = page
            .getByLabel('Query tabs')
            .getByRole('tab', { name: 'Query', exact: true });
        // Click the tab
        await tab1.click();
        await page.waitForTimeout(500);

        // Tab 1 should still have its header
        await expect(page.getByLabel('Key').first()).toHaveValue(
            'X-Test-Header',
        );
        await expect(page.getByLabel('Value').first()).toHaveValue(
            'test-value-tab1',
        );

        // Tab 1 should still have its variables
        await expect(variablesEditor).toContainText('"tab": 1');
    });
});
