import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-nikitakhrulev-Desktop-works-k711/d9731755-c336-4fbd-abea-b72adfe3beaf/scratchpad";
const browser = await chromium.launch();
async function run(label, width, dpr) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/location", { waitUntil: "networkidle" });
  const img = page.locator('img[alt="Вид на Кремль — в 10 минутах от k 7/11"]');
  await img.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const info = await img.evaluate((el) => {
    const card = el.closest('figure');
    const af = getComputedStyle(card, '::after');
    const sec = card.closest('section');
    return {
      imgClip: getComputedStyle(el).clipPath.slice(0,60),
      cardBg: getComputedStyle(card).backgroundColor,
      afterContent: af.content, afterBg: af.backgroundColor,
      afterClip: af.clipPath.slice(0,40), afterBlend: af.mixBlendMode, afterWH: af.width+"x"+af.height,
      sectionBg: sec ? getComputedStyle(sec).backgroundColor : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
  console.log(`[${label}] ` + JSON.stringify(info));
  const card = img.locator('xpath=ancestor::figure[1]');
  await card.screenshot({ path: `${OUT}/pc-card-${label}.png` });
  await ctx.close();
}
await run("desktop", 1440, 2);
await run("mobile", 390, 2);
await browser.close();
console.log("done");
