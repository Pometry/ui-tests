import { expect, test } from '@playwright/test';

test('Page has title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Search | Pometry');
});

test('Search page link works', async ({ page }) => {
    await page.goto('/saved-graphs');

    await page.getByRole('link', { name: 'Search', exact: true }).click();
    await expect(page).toHaveTitle('Search | Pometry');
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByText('Start Your Search')).toBeVisible();
});

test('Saved graphs page link works', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Explorations', exact: true }).click();
    await expect(page).toHaveURL(/\/saved-graphs$/);
    await expect(
        page.getByRole('button', {
            name: 'new_folder FOLDER',
        }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', {
            name: 'vanilla FOLDER',
        }),
    ).toBeVisible();
});

test('Home page link works', async ({ page }) => {
    await page.goto('/saved-graphs');

    await page.getByRole('link', { name: 'Pometry', exact: true }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page).toHaveTitle('Search | Pometry');
    await expect(page.getByText('Start Your Search')).toBeVisible();
});

test('Playground link works', async ({ page }) => {
    await page.goto('/');

    await page
        .getByRole('link', { name: 'GraphQL Playground', exact: true })
        .click();
    await expect(page).toHaveURL(/\/playground$/);
});
