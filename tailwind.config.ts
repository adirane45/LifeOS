import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
  ],
  darkMode: ['class'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
