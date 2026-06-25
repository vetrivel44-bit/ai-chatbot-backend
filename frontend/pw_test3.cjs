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

  // Design nav
  await page.getByText('Design', { exact: true }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'pw_shots/08_design_empty.png' });

  const designInput = page.locator('.design-input-row input');
  await designInput.fill('A simple pricing card with a title and a button');
  await page.locator('.design-input-row button[type="submit"]').click();
  await page.waitForTimeout(18000);
  await page.screenshot({ path: 'pw_shots/09_design_result.png' });

  await browser.close();
})();
