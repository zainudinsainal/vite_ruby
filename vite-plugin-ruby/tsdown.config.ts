import { copyFileSync } from 'fs'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  dts: true,
  sourcemap: true,
  target: 'node22',
  format: ['esm', 'cjs'],
  plugins: [
    {
      name: 'copy-html',
      writeBundle () {
        copyFileSync('src/dev-server-index.html', 'dist/dev-server-index.html')
      },
    },
  ],
})
