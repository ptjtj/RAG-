module.exports = {
  content: [
    // 告诉 Tailwind 去哪里寻找你使用了原子类的文件
    './src/**/*.{js,jsx,ts,tsx}',
    // 严禁 Tailwind 扫描 OpenAPI 自动生成的巨大文件和缓存！
    '!./src/services/api/**/*',
    '!./src/.umi/**/*',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // 引入我们刚才安装的排版插件
    require('@tailwindcss/typography'),
  ],
};
