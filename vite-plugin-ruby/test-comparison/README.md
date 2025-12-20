# Rolldown vs Rollup Comparison Tests

This directory contains practical tests comparing the output of Vite with Rolldown (Vite 8) vs Rollup (Vite 5).

## Running the Tests

### Full Test Suite

```bash
# From vite-plugin-ruby directory
cd test-comparison
./run-tests.sh
```

### Manual Testing

#### Step 1: Build with Rolldown (Vite 8)

```bash
cd ../example

# Ensure Vite 8 is installed
grep '"vite": "^8' package.json

# Build
pnpm run build

# Save output
cd ..
cp example/public/vite/.vite/manifest.json test-comparison/rolldown/manifest.json
```

#### Step 2: Build with Rollup (Vite 5)

```bash
cd example

# Switch to Vite 5
# Edit package.json: "vite": "^5.0.0"
pnpm install

# Clean and build
rm -rf public/vite
pnpm run build

# Save output
cd ..
cp example/public/vite/.vite/manifest.json test-comparison/rollup/manifest.json
```

#### Step 3: Compare Results

```bash
cd test-comparison
node compare.js
```

## Test Files

- `rolldown/` - Outputs from Rolldown build
- `rollup/` - Outputs from Rollup build
- `compare.js` - Automated comparison script
- `RESULTS.md` - Detailed test results
- `SUMMARY.md` - Executive summary

## What We're Testing

1. **Directory Structure**: Verify both bundlers flatten outputs to `/assets/`
2. **File Naming**: Compare output file name patterns
3. **Entry Point Mapping**: Check how nested source paths map to outputs
4. **Bug #7315**: Verify we're not affected by Rolldown's `[name]` bug

## Expected Results

✅ All files should be in `assets/` directory (no subdirectories)
✅ Entry points from nested directories should be flattened
✅ File naming pattern should be: `{basename}-[hash].{ext}`
✅ 85%+ identical path structures between bundlers

## Why This Matters

The plugin uses this code to determine output paths:

```typescript
const outputFileName = (ext: string) => ({ name }: { name: string }) => {
  if (typeof name === 'undefined') return ''
  const shortName = basename(name).split('.')[0]  // Strips directory
  return posix.join(assetsDir, `${shortName}-[hash].${ext}`)
}
```

This test verifies that:
- The `basename()` call works correctly with both bundlers
- Output structure is identical regardless of bundler
- We're not affected by Rolldown-specific bugs


