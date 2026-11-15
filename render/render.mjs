import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_SECONDS = 92;
const TOTAL_FRAMES = FPS * DURATION_SECONDS;
const root = process.cwd();

await rm('output', { recursive: true, force: true });
await mkdir('output', { recursive: true });

// Serve over HTTP: browser ES modules/CDN imports do not reliably load from file://.
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
    if (!file.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(file);
    const type = extname(file) === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
await new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(4173, '127.0.0.1', resolveListen);
});

const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--autoplay-policy=no-user-gesture-required'
  ]
});

let captured = 0;
let firstTimestamp = null;
let writeChain = Promise.resolve();
let captureError = null;

try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[browser]', msg.text());
  });
  page.on('pageerror', err => console.error('[pageerror]', err.message));

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForFunction(
    () => typeof window.renderFrame === 'function' && typeof window.setRenderResolution === 'function',
    { timeout: 90000 }
  );

  await page.addStyleTag({
    content: `
      html, body { width:1080px!important; height:1920px!important; overflow:hidden!important; }
      body { display:block!important; }
      .app { width:1080px!important; height:1920px!important; max-width:none!important; }
      .stage { width:1080px!important; height:1920px!important; flex:none!important; }
      canvas { width:1080px!important; height:1920px!important; }
      .hud, .note { display:none!important; }
      .overlay { padding:8% 7%!important; }
    `
  });
  await page.evaluate(() => window.setRenderResolution(1080, 1920));

  // Chromium's DevTools screencast streams viewport frames directly. This avoids
  // 2,760 separate Playwright screenshot round-trips and stores compact JPEGs.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Page.enable');
  cdp.on('Page.screencastFrame', async event => {
    try {
      const timestamp = event.metadata.timestamp;
      if (firstTimestamp === null) firstTimestamp = timestamp;
      const elapsed = timestamp - firstTimestamp;
      if (captured < TOTAL_FRAMES && elapsed + 0.0005 >= captured / FPS) {
        const index = captured++;
        const bytes = Buffer.from(event.data, 'base64');
        writeChain = writeChain.then(() =>
          writeFile('output/frame-' + String(index).padStart(5, '0') + '.jpg', bytes)
        );
        if (captured % 150 === 0) {
          console.log(`Captured ${captured}/${TOTAL_FRAMES} frames (${(captured / FPS).toFixed(1)}s)`);
        }
      }
    } catch (err) {
      captureError = err;
    } finally {
      await cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
    }
  });

  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 88,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
    everyNthFrame: 1
  });

  await page.evaluate(() => document.querySelector('#play')?.click());
  // The episode clock runs in real time; screencast samples it at 30 fps.
  await page.waitForTimeout((DURATION_SECONDS + 3) * 1000);
  await cdp.send('Page.stopScreencast').catch(() => {});
  await writeChain;
  if (captureError) throw captureError;

  console.log(`Captured ${captured} frames at up to ${WIDTH}x${HEIGHT}, target ${FPS} fps.`);
  if (captured < 30) throw new Error('Too few frames captured; check WebGL and browser rendering.');
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
