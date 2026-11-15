import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await page.goto('file://' + process.cwd() + '/index.html');
await page.waitForFunction(() => typeof window.renderFrame === 'function');
await page.addStyleTag({content:'.hud,.note{display:none!important}.app{width:1080px!important;height:1920px!important;max-width:none!important}.stage{height:1920px!important;flex:none!important}.overlay{padding:8% 7%!important}'});
await mkdir('output',{recursive:true});
for(let i=0;i<92*30;i++){
  await page.evaluate(t => window.renderFrame(t), i/30);
  await page.screenshot({path:'output/frame-'+String(i).padStart(5,'0')+'.png'});
}
await browser.close();
console.log('Rendered 2760 frames at 1080x1920 / 30fps.');
