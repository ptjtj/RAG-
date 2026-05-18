import { defineConfig } from '@umijs/max';
import routes from './src/routes/route';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'AI-KMS 知识库平台',
  },
  routes: routes,
  tailwindcss: {},
  npmClient: 'pnpm',
  plugins: ['@umijs/max-plugin-openapi'],
  openAPI: [
    {
      requestLibPath: "import { request } from '@umijs/max'",
      schemaPath: 'http://localhost:8080/swagger/doc.json', //  Go 后端生成的 JSON 地址
      projectName: 'api', // 代码会生成到 src/services/api 目录下
    },
  ],
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      compress:false,
    },
  },
});
