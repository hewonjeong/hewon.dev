import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: ['./{app,public}/**/*.{js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-pretendard)', ...defaultTheme.fontFamily.sans],
      },
      colors: {},
    },
  },
  plugins: [],
}
export default config
