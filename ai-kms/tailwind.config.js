module.exports = {
  content: [
    // 告诉 Tailwind 去哪里寻找使用了原子类的文件
    './src/pages/**/*.{js,jsx,ts,tsx}', // 只扫页面的代码
    './src/components/**/*.{js,jsx,ts,tsx}', // 只扫公共组件的代码
    './src/layouts/**/*.{js,jsx,ts,tsx}', // 只扫布局的代码
    './src/app.tsx',
    '!./src/.umi/**/*', // 排除 Umi 开发环境缓存
    '!./src/.umi-production/**/*', // 排除 Umi 生产环境缓存
    '!./src/services/api/**/*', // 排除 OpenAPI 自动生成的巨型接口文件
    '!./node_modules/**/*',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // 引入我们刚才安装的排版插件
    require('@tailwindcss/typography'),
  ],
};
