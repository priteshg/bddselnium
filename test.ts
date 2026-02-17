import { test as base } from 'playwright-bdd';
import { electron, type ElectronApplication, type Page } from '@playwright/test';
import { XXXX, XXX } from '../utils/setup';

type Fixtures = {
  grApp: GlobalRelayApp;
  resetApp: void;
};

export const test = base.extend<Fixtures>({
  // Launch once per worker
  grApp: [
    async ({ credentials }, use, testInfo) => {
      const grApp = await loadGlobalRelayApp(0, credentials, testInfo);
      await use(grApp);

      // Close once after all tests in worker
      await grApp.electronApp?.close();
    },
    { scope: 'worker' },
  ],

  // Per test reset hook
  resetApp: async ({ grApp }, use) => {
    const page = await grApp.electronApp.firstWindow();

    // If your app uses a single window, keep reusing that window
    await hardResetRenderer(page);

    await use();
  },
});

async function hardResetRenderer(page: Page) {
  // Clear renderer storage, then reload. Useful if app stores UI state locally.
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Prefer Playwright reload over location.reload()
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for something real in your UI that means “ready”
  // Replace selectors with something stable in your app
  await page.waitForSelector('[data-testid="app-ready"]', { state: 'visible' });

  // Optional: settle pending network and rendering
  await page.waitForLoadState('networkidle');
}
