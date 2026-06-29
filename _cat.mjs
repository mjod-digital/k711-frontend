import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-nikitakhrulev-Desktop-works-k711/d9731755-c336-4fbd-abea-b72adfe3beaf/scratchpad";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/apartments", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
// find the catalog/thead doc position to catch the hero→catalog transition
const theadDocY = await page.evaluate(() => {
  const t = document.querySelector('[class*="__thead"]');
  return t ? t.getBoundingClientRect().top + window.scrollY : 0;
});
console.log("thead doc Y:", theadDocY);
// capture around the transition where the old sliver appeared
for (const y of [theadDocY - 200, theadDocY - 40, theadDocY + 300]) {
  await page.evaluate((yy) => window.scrollTo(0, Math.max(0, yy)), y);
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => {
    const h = document.querySelector('header');
    const hr = h.getBoundingClientRect();
    return { headerTop: hr.top, headerVisible: hr.bottom > 0, headerClass: h.className.includes('hidden') ? 'HIDDEN' : 'shown' };
  });
  console.log(`scroll ~${Math.round(y)}:`, JSON.stringify(st));
  await page.screenshot({ path: `${OUT}/cat-h-${Math.round(y)}.png` });
}
await browser.close();
console.log("done");
