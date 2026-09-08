import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('PAGE LOADED SUCCESSFULLY');
    
    // Wait a bit and try clicking stock
    await new Promise(r => setTimeout(r, 2000));
    
  } catch (e) {
    console.log('TEST SCRIPT ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
