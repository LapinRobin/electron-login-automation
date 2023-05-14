const { ipcMain } = require('electron');
const SecureStore = require('./secureStorage');
const secureStore = new SecureStore();
const puppeteer = require('puppeteer-core');

//let mainWindow;
// code to remove stored credentials
// const store = new SecureStore();
// store.clear();

// store.delete('username');
// store.delete('email');
// store.delete('password');

ipcMain.handle('save-credentials', (event, username, email, password) => {
    secureStore.set('username', username);
    secureStore.set('email', email);
    secureStore.set('password', password);
    event.sender.send('credentials-saved');
});
  
ipcMain.handle('get-credentials', async () => {
  // Check if the credentials exist in the store
  if (!secureStore.has('username') || !secureStore.has('password') || !secureStore.has('email')) {
    // Return an object with null values if credentials are not stored
    return { username: null, email: null, password: null };
  }

  const username = await secureStore.get('username');
  const email = await secureStore.get('email');
  const password = await secureStore.get('password');

  // Return a plain JavaScript object with username and password
  return { username, email, password };
});


ipcMain.handle('perform-login-moodle', async (event, username, password) => {
    try {
      await performLoginMoodle(username, password);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
});

ipcMain.handle('perform-login-zmail', async (event, email, password) => {
    try {
      await performLoginZmail(email, password);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
});

ipcMain.handle('perform-login-planete', async (event, username, password) => {
    try {
      await performLoginPlanete(username, password);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
});

ipcMain.handle('perform-login-bv', async (event, username, password) => {
    try {
        await performLoginBv(username, password);
        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
});


async function performLoginMoodle(username, password) {
    // Launch Puppeteer with the Electron executable and headless set to false
    const browser = await puppeteer.launch({
        'ignoreDefaultArgs': ['--enable-automation'],
        headless: false,
        defaultViewport: null
    });
  
    // Close the default 'about:blank' page
    const [defaultPage] = await browser.pages();
    await defaultPage.close();
  
    const page = await browser.newPage();
    await page.goto('https://moodle.insa-lyon.fr/login/index.php?authCAS=CAS', { waitUntil: 'networkidle0' });
  
    // Add your login automation logic here
    await page.type('#username', username);
    await page.type('#password', password);
    await Promise.all([
      page.click('.btn-submit[name="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}

async function performLoginZmail(email, password) {

    // Launch Puppeteer with the Electron executable and headless set to false
    const browser = await puppeteer.launch({
        'ignoreDefaultArgs': ['--enable-automation'],
        headless: false,
        defaultViewport: null
    });

    // Close the default 'about:blank' page
    const [defaultPage] = await browser.pages();
    await defaultPage.close();

    const page = await browser.newPage();
    await page.goto('https://zmail.insa-lyon.fr/', { waitUntil: 'networkidle0' });

    // Add your login automation logic here
    await page.type('#username', email);
    await page.type('#password', password);
    await Promise.all([
        page.click('.ZLoginButton[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}

async function performLoginPlanete(username, password) {

    // Launch Puppeteer with the Electron executable and headless set to false
    const browser = await puppeteer.launch({
        'ignoreDefaultArgs': ['--enable-automation'],
        headless: false,
        defaultViewport: null
    });

    // Close the default 'about:blank' page
    const [defaultPage] = await browser.pages();
    await defaultPage.close();

    const page = await browser.newPage();
    await page.goto('https://login.insa-lyon.fr/cas/login?service=https://planete.insa-lyon.fr/uPortal/Login', { waitUntil: 'networkidle0' });

    // Add your login automation logic here
    await page.type('#username', username);
    await page.type('#password', password);
    // await page.click('.btn-submit[name="submit"]');
    await Promise.all([
        page.click('.btn-submit[name="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    // if the page is not https://planete.insa-lyon.fr/uPortal/, go to the site
    if (page.url() !== 'https://planete.insa-lyon.fr/uPortal/') {
        await page.goto('https://planete.insa-lyon.fr/uPortal/', { waitUntil: 'networkidle0' });
    }
}

async function performLoginBv(username, password) {
    // create usernameEmail. e.g., usernameEmail = 'username@insa-lyon'
    const usernameEmail = username + '@insa-lyon.fr';
    // Launch Puppeteer with the Electron executable and headless set to false
    const browser = await puppeteer.launch({
        'ignoreDefaultArgs': ['--enable-automation'],
        headless: false,
        defaultViewport: null
    });

    // Close the default 'about:blank' page
    const [defaultPage] = await browser.pages();
    await defaultPage.close();

    const page = await browser.newPage();
    await page.goto('https://bv.insa-lyon.fr/portal/webclient/#/home', { waitUntil: 'networkidle0' });

    // Add your login automation logic here
    await page.type('#username', usernameEmail);
    await page.type('#password', password);
    await Promise.all([
        page.click('#loginButton[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
}

