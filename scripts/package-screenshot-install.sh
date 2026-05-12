#!/bin/bash
# 在 ai-kms 目录运行以下命令安装依赖（pnpm 或 npm）
# pnpm:
# cd ai-kms
# pnpm add -D playwright minimist
# npx playwright install

# npm:
# cd ai-kms
# npm i -D playwright minimist
# npx playwright install
node scripts/screenshot.js --base http://localhost:8000 --out docs/screenshots