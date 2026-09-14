/**
 * Entry point for Phusion Passenger hosts (cPanel "Setup Node.js App",
 * Plesk, A2/Hostinger/Namecheap shared Node hosting).
 *
 * Those panels ask for an "Application startup file" and run it directly —
 * they do not run `npm start`. Point them at this file.
 *
 * Build first (`npm run build`), because this loads the compiled output.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const entry = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(entry)) {
  console.error(
    '\nBuild output missing at dist/server.js.\n' +
      'Run `npm install && npm run build` before starting the app.\n',
  );
  process.exit(1);
}

// `dist/server.js` only self-starts when run directly, so start it explicitly.
require(entry).start();
