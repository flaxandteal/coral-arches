const crypto = require('crypto');

// Shared secret for the admin account's TOTP device used by the E2E suite.
// Matches the device seeded in the test database (RFC 6238 test key, hex-encoded).
const TOTP_SECRET_HEX = '3132333435363738393031323334353637383930';

function generateTotp({ secretHex = TOTP_SECRET_HEX, step = 30, digits = 6, t0 = 0 } = {}) {
  const counter = Math.floor((Date.now() / 1000 - t0) / step);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', Buffer.from(secretHex, 'hex')).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 10 ** digits).toString().padStart(digits, '0');
}

module.exports = {
  projectId: 'arches',
  video: true,
  e2e: {
    chromeWebSecurity: false,
    experimentalStudio: true,
    baseUrl: "http://localhost:8000",
    defaultCommandTimeout: 12000,
    pageLoadTimeout: 90000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      on('task', {
        generateOtp(opts) {
          return generateTotp(opts || {});
        },
      });
    },
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
}
