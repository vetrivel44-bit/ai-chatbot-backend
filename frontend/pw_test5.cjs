const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('requestfailed', req => console.log('REQFAIL:', req.url(), req.failure()?.errorText));

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
  await page.screenshot({ path: 'pw_shots/d1_before_send.png' });
  await page.locator('button.w-9.h-9').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'pw_shots/d2_just_after_send.png' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'pw_shots/d3_after_wait.png' });

  await browser.close();
})();
