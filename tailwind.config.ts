import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: ['./{app,public}/**/*.{js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-pretendard)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Segoe UI"',
          '"Malgun Gothic"',
          '"Noto Sans KR"',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      colors: {},
    },
  },
  plugins: [],
}
export default config
