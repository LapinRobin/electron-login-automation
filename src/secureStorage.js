const Store = require('electron-store');
const crypto = require('crypto');
const keytar = require('keytar');
const algorithm = 'aes-256-cbc';

const KEYCHAIN_SERVICE = 'LoginAutomationEncryption';
const KEYCHAIN_ACCOUNT_KEY = 'encryptionKey';
const KEYCHAIN_ACCOUNT_IV = 'encryptionIV';

async function getKeyAndIV() {
  let key = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT_KEY);
  let iv = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT_IV);

  if (!key || !iv) {
    key = crypto.randomBytes(32).toString('hex');
    iv = crypto.randomBytes(16).toString('hex');

    await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT_KEY, key);
    await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT_IV, iv);
  }

  return { key: Buffer.from(key, 'hex'), iv: Buffer.from(iv, 'hex') };
}

function encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

class SecureStore extends Store {
  clear() {
    super.clear();
  }
  async set(key, value) {
    const { key: encryptionKey, iv } = await getKeyAndIV();
    const encryptedValue = encrypt(value, encryptionKey, iv);
    super.set(key, encryptedValue);
  }

  async get(key, defaultValue) {
    const encryptedValue = super.get(key);

    // Check if the encrypted value is a valid hexadecimal string
    const isHex = /^[\da-f]+$/i.test(encryptedValue);

    if (!isHex) {
      return defaultValue;
    }

    try {
      const { key: encryptionKey, iv } = await getKeyAndIV();
      return decrypt(encryptedValue, encryptionKey, iv);
    } catch (error) {
      console.error('Failed to decrypt value:', error);
      return defaultValue;
    }
  }
}



module.exports = SecureStore;
