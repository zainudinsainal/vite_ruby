import { copyFileSync } from 'fs'
import type { Options } from 'tsdown'

export default {
  clean: true,
  dts: true,
  shims: true,
  sourcemap: true,
  target: 'node20',
  format: ['esm'],
  onSuccess () {
    copyFileSync('src/dev-server-index.html', 'dist/dev-server-index.html')
  },
} satisfies Options
