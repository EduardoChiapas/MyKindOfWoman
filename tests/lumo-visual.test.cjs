'use strict';
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/Eduardito/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:880,height:880},deviceScaleFactor:1});
    await page.goto(pathToFileURL(path.join(__dirname,'lumo-preview.html')).href);
    await page.waitForFunction(() => window.previewReady === true);
    await page.screenshot({path:path.join(__dirname,'lumo-render-preview.png'),fullPage:true});
    const result = await page.evaluate(() => {
      const pixel = document.getElementById('world').getContext('2d').getImageData(0,0,880,660).data;
      let opaqueBlueOrPink = 0;
      for (let i=0;i<pixel.length;i+=4) {
        if(pixel[i+2]>200&&pixel[i]<75&&pixel[i+1]<75||pixel[i]>230&&pixel[i+2]>200&&pixel[i+1]<65) opaqueBlueOrPink++;
      }
      return {loaded:[...actor.images.values()].every(image=>image.complete&&image.naturalWidth),
        sampleCount:actor.samples.size,opaqueBlueOrPink};
    });
    if(!result.loaded || result.opaqueBlueOrPink>2) throw Error(JSON.stringify(result));
    console.log('PASS: actual browser renders intact original sheets without visible blue/magenta halos.', JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
