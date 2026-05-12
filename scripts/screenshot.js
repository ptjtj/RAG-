// 简单的 Playwright 截图脚本
// 使用方法：
// 1) 在 ai-kms 目录运行：pnpm add -D playwright 或 npm i -D playwright
// 2) 启动前端：pnpm dev
// 3) 执行：node scripts/screenshot.js --base http://localhost:8000 --out ../docs/screenshots

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const argv = require('minimist')(process.argv.slice(2));
const base = argv.base || 'http://localhost:8000';
const outDir = argv.out || path.join(__dirname, '..', 'docs', 'screenshots');

const routes = [
  { url: '/', file: 'chat.png' },
  { url: '/login', file: 'login.png' },
  { url: '/chat', file: 'chat.png' },
  { url: '/kb', file: 'kb.png' },
  { url: '/userManage', file: 'userManage.png' },
];

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.warn('启动 Playwright Chromium 失败：', err.message || err);
    // 尝试回退到系统安装的 Chrome（需要用户设置 CHROME_PATH 环境变量）
    const chromePath = process.env.CHROME_PATH;
    if (chromePath) {
      console.log('尝试使用系统 Chrome（来自 CHROME_PATH）:', chromePath);
      try {
        browser = await chromium.launch({ headless: true, executablePath: chromePath });
      } catch (err2) {
        console.error('使用系统 Chrome 启动也失败：', err2.message || err2);
        console.error('请运行 `npx playwright install` 安装 Playwright 浏览器，或设置有效的 CHROME_PATH 指向本机 Chrome 可执行文件。');
        process.exit(1);
      }
    } else {
      console.error('Playwright 浏览器二进制未找到。请运行 `npx playwright install` 安装浏览器，或设置环境变量 CHROME_PATH 指向本机 Chrome 可执行文件后重试。');
      process.exit(1);
    }
  }
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  for (const r of routes) {
    const target = new URL(r.url, base).toString();
    try {
      console.log('打开：', target);
      const resp = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
      if (!resp || resp.status() >= 400) {
        console.warn(`警告：访问 ${target} 返回状态 ${resp ? resp.status() : 'no response'}`);
      }
      // 等待界面稳定（可按需调整选择器）
      await page.waitForTimeout(800);
      const filePath = path.join(outDir, r.file);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log('已保存：', filePath);
    } catch (err) {
      console.error('截屏失败：', target, err.message || err);
    }
  }

  await browser.close();
  console.log('全部完成');
})();
