module.exports = {
  content: [
    // 告诉 Tailwind 去哪里寻找你使用了原子类的文件
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // 引入我们刚才安装的排版插件
    require('@tailwindcss/typography'),
  ],
};
