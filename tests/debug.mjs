import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:8000/menu.html');
  await page.waitForLoadState('networkidle');
  
  // Check what's in the DOM
  const html = await page.content();
  console.log('=== PAGE HTML (first 5000 chars) ===');
  console.log(html.substring(0, 5000));
  
  // Check if menu-grid exists
  const menuGrid = await page.$('#menu-grid');
  console.log('menu-grid element:', menuGrid ? 'EXISTS' : 'NOT FOUND');
  
  // Check for JavaScript errors
  const jsErrors = await page.evaluate(() => window.jsErrors || []);
  console.log('JS Errors:', jsErrors);
  
  // Check if menu.json loads
  const menuJson = await fetch('http://localhost:8000/data/menu.json').then(r => r.json());
  console.log('menu.json:', menuJson);
  
  // Check site.json
  const siteJson = await fetch('http://localhost:8000/data/site.json').then(r => r.json());
  console.log('site.json:', siteJson);
  
  await browser.close();
}

debug().catch(console.error);