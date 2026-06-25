const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    const token = 'local_' + Date.now() + '_dGVzdA==';
    localStorage.setItem('token', token);
    localStorage.setItem('vetroai_userinfo', JSON.stringify({ name: 'Test User', email: 'test@local', isLocal: true }));
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Close artifacts gallery if reopened from previous state, then close via X button
  // Artifacts nav
  await page.getByText('Artifacts', { exact: true }).first().click();
  await page.waitForTimeout(400);
  await page.locator('.modal-x').first().click();
  await page.waitForTimeout(300);

  // Code nav -> should open CodePlayground
  await page.getByText('Code', { exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'pw_shots/07_code_playground.png' });
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('.modal-x, .overlay button').first().click().catch(() => {});
  await page.waitForTimeout(400);

  // Design nav
  await page.getByText('Design', { exact: true }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'pw_shots/08_design_empty.png' });

  const designInput = page.locator('.design-input-row input');
  await designInput.fill('A simple pricing card with a title and a button');
  await page.locator('.design-input-row button[type="submit"]').click();
  await page.waitForTimeout(15000);
  await page.screenshot({ path: 'pw_shots/09_design_result.png' });

  await browser.close();
})();
