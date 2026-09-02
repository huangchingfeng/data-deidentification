// Renders public/og.png (1200×630) from an inline HTML template with the local Chrome.
// Autolab 擴充版：改為 CVI 淺色配色，並展示新增的金融／外籍人士類別。
// Run: npm run og
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const html = `<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8">
<style>
  /* Autolab CVI 淺色版：白底黑字，Cyan 只用於圖形與強調塊 */
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden;
    font-family: Inter, -apple-system, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
    color: #1C1C1E; background: #FFFFFF; position: relative; }
  .grid { position: absolute; inset: 0;
    background-image: linear-gradient(rgba(0,153,187,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,153,187,.07) 1px, transparent 1px);
    background-size: 40px 40px; mask-image: linear-gradient(160deg, rgba(0,0,0,.9), transparent 70%); }
  .bar { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #00D4FF, #0099BB 60%, #FF6B35); }
  .wrap { position: relative; display: grid; grid-template-columns: 1.05fr 1fr; gap: 34px; padding: 58px 56px 96px; height: 100%; align-items: center; }
  .kicker { display: inline-flex; align-items: center; gap: 12px; font-size: 29px; font-weight: 700; color: #0099BB; letter-spacing: .03em; }
  .kicker .dot { width: 13px; height: 13px; border-radius: 50%; background: #34C759; box-shadow: 0 0 0 5px rgba(52,199,89,.20); }
  h1 { font-size: 64px; line-height: 1.1; white-space: nowrap; font-weight: 800; margin-top: 16px; letter-spacing: -.01em; }
  h1 small { display: block; font-size: 30px; font-weight: 600; color: #636366; margin-top: 14px; letter-spacing: .01em; white-space: normal; }
  .chips { display: flex; flex-wrap: wrap; gap: 11px; margin-top: 26px; }
  .chip { padding: 8px 20px; border-radius: 999px; background: rgba(0,153,187,.10); border: 1.5px solid rgba(0,153,187,.30); font-size: 25px; font-weight: 700; color: #0A1628; }
  .facts { margin-top: 24px; display: grid; gap: 8px; font-size: 22px; font-weight: 600; color: #48484A; white-space: nowrap; }
  .facts div::before { content: '✓'; color: #34C759; font-weight: 800; margin-right: 10px; }
  .url { position: absolute; left: 56px; bottom: 32px; font-size: 26px; font-weight: 700; color: #0099BB; letter-spacing: .02em; }
  .card { align-self: center; justify-self: end; background: #fff; color: #1C1C1E; border: 1px solid #E5E5EA; border-radius: 18px; padding: 26px;
    box-shadow: 0 24px 60px rgba(10,22,40,.16); transform: rotate(-1.5deg); }
  .card .title { font-size: 25px; font-weight: 800; text-align: center; margin-bottom: 16px; letter-spacing: .1em; }
  .row { font-size: 20px; line-height: 2.0; white-space: nowrap; }
  .m { padding: 1px 8px; border-radius: 6px; font-weight: 600; }
  .n { background: #ffe0b2; } .i { background: #ffcdd2; } .p { background: #c8e6c9; } .a { background: #bbdefb; }
  .cc { background: #ffab91; } .r { background: #f8bbd0; } .b { background: #ffcc80; }
  .legend { margin-top: 14px; display: flex; gap: 7px; flex-wrap: wrap; font-size: 16px; color: #636366; }
  .legend span { padding: 2px 9px; border-radius: 5px; }
  .stamp { position: absolute; right: 56px; bottom: 30px; display: flex; align-items: center; gap: 12px; font-size: 23px; color: #636366; }
  .stamp b { color: #0A1628; }
  .stamp svg { display: block; }
</style></head>
<body>
<div class="bar"></div>
<div class="grid"></div>
<div class="wrap">
  <div>
    <div class="kicker"><span class="dot"></span>純前端・資料不出電腦・可還原</div>
    <h1>個資去識別化工具<small>丟給 AI 之前，先過這一關</small></h1>
    <div class="chips"><span class="chip">PDF</span><span class="chip">Word</span><span class="chip">Excel</span><span class="chip">TXT</span><span class="chip">Markdown</span></div>
    <div class="facts"><div>20 類個資：含信用卡、銀行帳號、保單、居留證、病歷號</div><div>保留原格式輸出、零殘留原文，CSV 編碼表可完整還原</div></div>
  </div>
  <div class="card">
    <div class="title">委外服務契約書</div>
    <div class="row">代表人：<span class="m n">范OO</span>　手機 <span class="m p">0917-***-491</span></div>
    <div class="row">身分證 <span class="m i">L28******7</span>　居留證 <span class="m r">FA1******9</span></div>
    <div class="row">地址：<span class="m a">新北市板橋區***</span></div>
    <div class="row">信用卡 <span class="m cc">4532-****-****-0366</span></div>
    <div class="row">匯款帳號 <span class="m b">01******9012</span></div>
    <div class="legend"><span class="n">姓名</span><span class="i">身分證</span><span class="r">居留證</span><span class="p">手機</span><span class="a">地址</span><span class="cc">信用卡</span><span class="b">銀行帳號</span></div>
  </div>
</div>
<div class="url">deid.autolab.cloud</div>
<div class="stamp">
  <svg viewBox="0 0 402 160" width="46" height="18"><defs><g id="w">
    <polygon points="188,26 0,0 16,22 168,90"/><polygon points="166,100 34,60 42,72 170,114"/><polygon points="174,122 68,88 76,100 182,140"/>
  </g></defs><use href="#w" fill="#00D4FF"/><use href="#w" fill="#00D4FF" transform="translate(392,0) scale(-1,1)"/></svg>
  <span>by <b>AI峰哥</b> · 改作自 Dean Lin · MIT</span>
</div>
</body></html>`;

mkdirSync('public', { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.screenshot({ path: 'public/og.png', type: 'png' });
await browser.close();
console.log('saved public/og.png');
