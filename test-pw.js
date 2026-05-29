const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://mak-tic-portal.vercel.app/register');
  await page.fill('#fullName', 'Test User');
  await page.fill('#email', 'real.test@test.com');
  await page.fill('#password', 'password123');
  
  page.on('response', async response => {
    if (response.url().includes('signup')) {
      console.log('Signup Response:', response.status());
      console.log(await response.json().catch(()=>'No JSON'));
    }
  });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await browser.close();
})();
