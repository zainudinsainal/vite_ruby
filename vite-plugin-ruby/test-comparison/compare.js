#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Comparing Rolldown vs Rollup Output\n')
console.log('='.repeat(70))

// Load manifests
const rolldownManifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'rolldown/manifest.json'), 'utf-8'))
const rollupManifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'rollup/manifest.json'), 'utf-8'))

// Get all entry points
const rolldownEntries = Object.keys(rolldownManifest).filter(key => rolldownManifest[key].isEntry)
const rollupEntries = Object.keys(rollupManifest).filter(key => rollupManifest[key].isEntry)

console.log('\n📊 Entry Points Comparison\n')
console.log(`Rolldown entries: ${rolldownEntries.length}`)
console.log(`Rollup entries: ${rollupEntries.length}`)

// Compare output file paths
console.log('\n📂 Output File Path Structure Comparison\n')
console.log('Entry'.padEnd(40), '| Rolldown Output'.padEnd(35), '| Rollup Output')
console.log('-'.repeat(110))

const allEntries = new Set([...rolldownEntries, ...rollupEntries])
let identical = 0
let different = 0

allEntries.forEach((entry) => {
  const rolldownEntry = rolldownManifest[entry]
  const rollupEntry = rollupManifest[entry]

  if (!rolldownEntry || !rollupEntry) {
    console.log(`⚠️  ${entry}: Missing in ${!rolldownEntry ? 'Rolldown' : 'Rollup'}`)
    different++
    return
  }

  // Extract just the path structure (ignore hash)
  const rolldownPath = rolldownEntry.file.replace(/-[a-zA-Z0-9_-]+\./, '-[hash].')
  const rollupPath = rollupEntry.file.replace(/-[a-zA-Z0-9_-]+\./, '-[hash].')

  const match = rolldownPath === rollupPath ? '✅' : '❌'

  if (rolldownPath === rollupPath)
    identical++
  else
    different++

  const entryShort = entry.length > 38 ? `${entry.substring(0, 35)}...` : entry
  console.log(
    `${match} ${entryShort.padEnd(38)}`,
    `| ${rolldownPath.padEnd(33)}`,
    `| ${rollupPath}`,
  )
})

console.log(`\n${'='.repeat(70)}`)
console.log('\n📈 Summary\n')
console.log(`✅ Identical path structures: ${identical}`)
console.log(`❌ Different path structures: ${different}`)

// Analyze directory structure
console.log('\n📁 Directory Structure Analysis\n')

function extractDirectories (manifest) {
  const dirs = new Set()
  Object.values(manifest).forEach((entry) => {
    if (entry.file) {
      const dir = path.dirname(entry.file)
      dirs.add(dir)
    }
  })
  return Array.from(dirs).sort()
}

const rolldownDirs = extractDirectories(rolldownManifest)
const rollupDirs = extractDirectories(rollupManifest)

console.log('Rolldown directories:')
rolldownDirs.forEach(dir => console.log(`  - ${dir}`))

console.log('\nRollup directories:')
rollupDirs.forEach(dir => console.log(`  - ${dir}`))

// Check if all outputs are in 'assets' directory (flattened)
const allInAssets = rolldownDirs.length === 1 && rolldownDirs[0] === 'assets'
                    && rollupDirs.length === 1 && rollupDirs[0] === 'assets'

console.log(`\n${'='.repeat(70)}`)
if (allInAssets) {
  console.log('\n✅ SUCCESS: Both Rolldown and Rollup flatten all outputs to /assets/')
  console.log('   The directory structure is IDENTICAL between bundlers.')
}
else {
  console.log('\n⚠️  Different directory structures detected!')
}

console.log(`\n${'='.repeat(70)}`)

process.exit(different > 0 ? 1 : 0)
