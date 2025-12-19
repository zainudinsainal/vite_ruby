import { copyFileSync } from 'fs'
import type { Options } from 'tsdown'

export const tsdown: Options = {
  clean: true,
  dts: true,
  shims: true,
  sourcemap: true,
  target: 'node18',
  format: ['esm', 'cjs'],
  async onSuccess () {
    copyFileSync('src/dev-server-index.html', 'dist/dev-server-index.html')
  },
}
