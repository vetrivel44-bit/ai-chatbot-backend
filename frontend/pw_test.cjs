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
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'pw_shots/01_home.png' });

  // Identity question test
  const textarea = page.locator('textarea').first();
  await textarea.click();
  await textarea.fill('who are you');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'pw_shots/02_identity.png' });

  // New chat to reset
  await page.getByText('New chat', { exact: false }).first().click().catch(() => {});
  await page.waitForTimeout(500);

  // Projects nav
  await page.getByText('Projects', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw_shots/03_projects_empty.png' });

  // Create new project
  await page.getByText('New project', { exact: false }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw_shots/04_new_project_modal.png' });
  const nameInput = page.locator('input[placeholder="e.g. Coding Space"]');
  await nameInput.fill('Demo Project');
  await page.getByText('Save', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw_shots/05_project_active_badge.png' });

  // Artifacts nav
  await page.getByText('Artifacts', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw_shots/06_artifacts_empty.png' });
  await page.keyboard.press('Escape');

  // Code nav
  await page.getByText('Code', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw_shots/07_code_playground.png' });
  await page.keyboard.press('Escape');

  // Design nav
  await page.getByText('Design', { exact: true }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'pw_shots/08_design_empty.png' });

  const designInput = page.locator('.design-input-row input');
  await designInput.fill('A simple pricing card with a title and a button');
  await page.locator('.design-input-row button[type="submit"]').click();
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'pw_shots/09_design_result.png' });

  await browser.close();
})();
