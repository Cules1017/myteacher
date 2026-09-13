const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  console.log("Navigating...");
  await page.evaluate(() => {
    const link = document.querySelector('a[href="/cong-viec"]');
    if (link) link.click();
    else console.log("Link not found");
  });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
