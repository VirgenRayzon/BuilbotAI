/** Run inside `firebase emulators:exec` with the demo project, never live Firebase. */
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Start the Firebase demo emulators first.');
const env = { ...process.env, NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-buildbot-qr', NEXT_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost', NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-qr-app',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-buildbot-qr.appspot.com', NEXT_PUBLIC_FIREBASE_USE_EMULATORS: 'true', QR_INVENTORY_TEST: 'true' };
const run = args => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { env, stdio: 'inherit', windowsHide: true });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Verification exited with ${code}`)));
});
if (!process.argv.includes('--browser-only')) await run(['node_modules/tsx/dist/cli.mjs', '--test', 'tests/qr-inventory.integration.ts']);
await mkdir('.tmp', { recursive: true });
let occupied = false;
try { await fetch('http://localhost:9002/signin', { signal: AbortSignal.timeout(3000) }); occupied = true; } catch { /* Port is free. */ }
if (occupied) throw new Error('Port 9002 is in use. Stop this workspace dev server before isolated browser verification.');
const log = createWriteStream('.tmp/qr-browser-server.log');
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--turbopack', '-p', '9002'], { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
server.stdout.pipe(log); server.stderr.pipe(log);
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw new Error('Dev server exited; inspect .tmp/qr-browser-server.log.');
    try {
      const response = await fetch('http://localhost:9002/signin');
      if (response.ok && response.headers.get('X-Buildbot-QR-Test') === 'demo-buildbot-qr') { ready = true; break; }
    } catch { /* Booting. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error('Dev server did not become ready on port 9002.');
  await run(['node_modules/@playwright/test/cli.js', 'test', 'tests/qr-inventory.spec.ts', '--workers=1', '--output=.tmp/qr-browser-results', ...(process.argv.includes('--system-only') ? ['--grep', 'Add System'] : [])]);
} finally {
  server.stdout.unpipe(log); server.stderr.unpipe(log);
  if (process.platform === 'win32' && server.pid) await new Promise(resolve => {
    const stop = spawn('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    stop.on('exit', resolve); stop.on('error', resolve);
  });
  else server.kill();
  log.end();
}
