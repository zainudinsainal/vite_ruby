import { describe, test, expect } from 'vitest'
import type { Plugin } from 'vite'
import { defaultConfig } from '@plugin/config'
import ViteRuby from '@plugin/index'

describe('config', () => {
  test('environment defaults', () => {
    const plugin = ViteRuby()
    const pluginConfigHook = (plugin[0] as Plugin).config!
    const pluginConfig = typeof pluginConfigHook === 'function' ? pluginConfigHook : pluginConfigHook.handler
    defaultConfig.configPath = './default.vite.json'

    const productionConfig = pluginConfig(defaultConfig, { mode: 'production', command: 'build' }) as any
    expect(productionConfig.build.emptyOutDir).toBe(false)
    expect(productionConfig.build.sourcemap).toBe(true)

    const stagingConfig = pluginConfig(defaultConfig, { mode: 'staging', command: 'build' }) as any
    expect(stagingConfig.build.emptyOutDir).toBe(false)
    expect(stagingConfig.build.sourcemap).toBe(true)

    const developmentConfig = pluginConfig(defaultConfig, { mode: 'development', command: 'serve' }) as any
    expect(developmentConfig.build.emptyOutDir).toBe(true)
    expect(developmentConfig.build.sourcemap).toBe(false)

    const testConfig = pluginConfig(defaultConfig, { mode: 'test', command: 'serve' }) as any
    expect(testConfig.build.emptyOutDir).toBe(true)
    expect(testConfig.build.sourcemap).toBe(false)

    expect(() => {
      pluginConfig({ ...defaultConfig, build: { ssr: true } }, { mode: 'production', command: 'build' })
    }).toThrow('No SSR entrypoint available')
  })
})
