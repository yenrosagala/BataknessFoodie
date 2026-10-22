import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:8000/index.html#login');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit for admin.js to run
  await page.waitForTimeout(2000);
  
  // Check if login form is visible
  const loginForm = await page.$('#login-form');
  console.log('login-form element:', loginForm ? 'EXISTS' : 'NOT FOUND');
  
  if (loginForm) {
    const isHidden = await loginForm.evaluate(el => el.hidden);
    console.log('login-form hidden:', isHidden);
    
    const loginSection = await page.$('#login');
    if (loginSection) {
      const loginHidden = await loginSection.evaluate(el => el.hidden);
      console.log('#login section hidden:', loginHidden);
    }
    
    const appSection = await page.$('#app');
    if (appSection) {
      const appHidden = await appSection.evaluate(el => el.hidden);
      console.log('#app section hidden:', appHidden);
    }
    
    const staffSection = await page.$('#staff');
    if (staffSection) {
      const staffHidden = await staffSection.evaluate(el => el.hidden);
      console.log('#staff section hidden:', staffHidden);
    }
  }
  
  // Check if admin.js loaded
  const adminJsLoaded = await page.evaluate(() => typeof window.bootStaff === 'function');
  console.log('admin.js loaded (bootStaff exists):', adminJsLoaded);
  
  // Check localStorage
  const session = await page.evaluate(() => localStorage.getItem('batak-admin-session'));
  console.log('localStorage session:', session);
  
  // Check page content
  const html = await page.content();
  console.log('=== PAGE HTML (first 3000 chars) ===');
  console.log(html.substring(0, 3000));
  
  await browser.close();
}

debug().catch(console.error);