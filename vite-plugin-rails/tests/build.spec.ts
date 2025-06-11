import { resolve } from 'path'
import { readFileSync } from 'fs'
import { beforeAll, describe, test, expect } from 'vitest'
import execa from 'execa'
import { glob } from 'tinyglobby'

const projectRoot = resolve(__dirname, '../')
const exampleDir = `${projectRoot}/example`

describe('config', () => {
  beforeAll(async () => {
    await execa('npm', ['run', 'build'], { stdio: process.env.DEBUG ? 'inherit' : undefined, cwd: exampleDir })
  }, 60000)

  test('generated files', async () => {
    const outDir = `${exampleDir}/public/vite`
    const files = await glob('**/*', { cwd: outDir, onlyFiles: true })

    // Check for expected file patterns instead of specific hashes
    const hasFilePattern = (pattern: RegExp) => files.some(file => pattern.test(file))

    // CSS files
    expect(hasFilePattern(/^assets\/app-[a-zA-Z0-9_-]+\.css$/)).toBe(true)
    expect(hasFilePattern(/^assets\/app-[a-zA-Z0-9_-]+\.css\.br$/)).toBe(true)
    expect(hasFilePattern(/^assets\/app-[a-zA-Z0-9_-]+\.css\.gz$/)).toBe(true)
    expect(hasFilePattern(/^assets\/sassy-[a-zA-Z0-9_-]+\.css$/)).toBe(true)
    expect(hasFilePattern(/^assets\/theme-[a-zA-Z0-9_-]+\.css$/)).toBe(true)
    expect(hasFilePattern(/^assets\/vue-[a-zA-Z0-9_-]+\.css$/)).toBe(true)

    // JS files
    expect(hasFilePattern(/^assets\/external-[a-zA-Z0-9_-]+\.js$/)).toBe(true)
    expect(hasFilePattern(/^assets\/external-[a-zA-Z0-9_-]+\.js\.map$/)).toBe(true)
    expect(hasFilePattern(/^assets\/index-[a-zA-Z0-9_-]+\.js$/)).toBe(true)
    expect(hasFilePattern(/^assets\/main-[a-zA-Z0-9_-]+\.js$/)).toBe(true)
    expect(hasFilePattern(/^assets\/vue-[a-zA-Z0-9_-]+\.js$/)).toBe(true)

    // Images
    expect(hasFilePattern(/^assets\/logo-[a-zA-Z0-9_-]+\.svg$/)).toBe(true)
    expect(hasFilePattern(/^assets\/logo-[a-zA-Z0-9_-]+\.png$/)).toBe(true)

    // Static files
    expect(files).toContain('index.html')
    expect(files).toContain('index.html.br')
    expect(files).toContain('index.html.gz')

    const parseManifest = (path: string) => JSON.parse(readFileSync(`${outDir}/.vite/${path}`, 'utf-8'))
    const manifest = parseManifest('manifest.json')
    const manifestAssets = parseManifest('manifest-assets.json')

    expect({ ...manifest, ...manifestAssets }).toMatchSnapshot()
  })
})
