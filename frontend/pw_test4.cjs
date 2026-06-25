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

  const textarea = page.locator('textarea').first();
  await textarea.click();
  await textarea.fill('who are you');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'pw_shots/10_identity_fixed.png' });

  // your name test
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const textarea2 = page.locator('textarea').first();
  await textarea2.click();
  await textarea2.fill('your name?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'pw_shots/11_yourname_fixed.png' });

  // code -> artifact test
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const textarea3 = page.locator('textarea').first();
  await textarea3.click();
  await textarea3.fill('write a python function to reverse a linked list, with comments and a test, at least 10 lines');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(14000);
  await page.screenshot({ path: 'pw_shots/12_code_response.png' });

  const artifactBtn = page.getByText('Artifact', { exact: false }).first();
  if (await artifactBtn.count()) {
    await artifactBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'pw_shots/13_artifact_opened.png' });
  }

  await browser.close();
})();
