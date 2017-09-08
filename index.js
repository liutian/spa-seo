const puppeteer = require('puppeteer');
const Koa = require('koa');
const env = require('yargs').argv;

const app = new Koa();
let browser;
const visitMap = new Map();
let visitCount = 0;

// 初始化浏览器实例
(async () => {
  browser = await puppeteer.launch();
})();

// 接收请求
app.use(async (ctx) => {
  let startTime = Date.now();
  // 为每一个请求单独开启一个浏览器页面
  const visitId = ++visitCount;
  const page = await browser.newPage();
  await page.exposeFunction('renderReady', async () => {
    if (visitMap.has(visitId)) {
      visitMap.get(visitId)[0]();
      visitMap.delete(visitId);
    }
    return Promise.resolve();
  })

  let fetchTime = Date.now();
  await page.goto((env.preUrl || 'http://127.0.0.1/') + ctx.url);
  await renderReadyFactory(visitId);
  let content = await page.content();
  ctx.set('fetch-time', Date.now() - fetchTime);

  page.close();
  ctx.body = content;
  ctx.set('total-time', Date.now() - startTime);
});

const port = env.port || 3000;
app.listen(port);
console.log('listen ' + port);


function renderReadyFactory(visitId) {
  return new Promise((resolve, reject) => {
    visitMap.set(visitId, [resolve, reject]);
  });
}



