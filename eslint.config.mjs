import nextPlugin from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextPlugin,
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**'],
  },
]

export default config
