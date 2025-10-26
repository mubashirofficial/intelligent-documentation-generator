import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dark: { bg: '#0a0a0a', surface: '#1a1a1a', elevated: '#2a2a2a', border: '#3a3a3a' },
      },
    },
  },
  plugins: [],
};
export default config;
