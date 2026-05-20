module.exports = {
  content: [
   
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/layouts/**/*.{js,jsx,ts,tsx}',
    './src/app.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // 引入我们刚才安装的排版插件
    require('@tailwindcss/typography'),
  ],
};
