import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_SECONDS = 92;
const TOTAL_FRAMES = FPS * DURATION_SECONDS;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1
  });

  await page.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.renderFrame === 'function');

  // Resize the WebGL renderer to the final portrait output resolution.
  await page.waitForFunction(() => typeof window.setRenderResolution === 'function');
  await page.evaluate(() => window.setRenderResolution(1080, 1920));

  await page.addStyleTag({
    content: `
      html, body { width:1080px!important; height:1920px!important; overflow:hidden!important; }
      body { display:block!important; }
      .app { width:1080px!important; height:1920px!important; max-width:none!important; }
      .stage { width:1080px!important; height:1920px!important; flex:none!important; }
      .hud, .note { display:none!important; }
      .overlay { padding:8% 7%!important; }
    `
  });

  await mkdir('output', { recursive: true });
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    await page.evaluate(seconds => window.renderFrame(seconds), frame / FPS);
    await page.screenshot({
      path: 'output/frame-' + String(frame).padStart(5, '0') + '.png',
      type: 'png'
    });
  }
  console.log(`Rendered ${TOTAL_FRAMES} frames at ${WIDTH}x${HEIGHT}, ${FPS} fps.`);
} finally {
  await browser.close();
}
