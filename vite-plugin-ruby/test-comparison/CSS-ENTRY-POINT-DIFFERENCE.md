# Why CSS Entry Points Differ Between Rolldown and Rollup

## The Difference

When you have a **CSS file as an entry point** (imported directly):

| Bundler | Output | Files Created |
|---------|--------|---------------|
| **Rolldown** | `assets/theme-[hash].js` | `.js` wrapper + `.css` file |
| **Rollup** | `assets/theme-[hash].css` | `.css` file only |

## Rolldown Behavior (Vite 8)

```json
{
  "file": "assets/theme-Dk8Vp-QR.js",
  "src": "../assets/theme.css",
  "isEntry": true,
  "css": ["assets/theme-C09nxUps.css"]  ← Actual CSS file here!
}
```

**Creates TWO files:**
1. `theme-Dk8Vp-QR.js` - JavaScript wrapper (entry point)
2. `theme-C09nxUps.css` - Actual CSS content

**The JS file contains:**
```javascript
// Minimal JS that imports the CSS
import './theme-C09nxUps.css';
```

## Rollup Behavior (Vite 5)

```json
{
  "file": "assets/theme-CK6FhHUh.css",
  "src": "../assets/theme.css",
  "isEntry": true
}
```

**Creates ONE file:**
1. `theme-CK6FhHUh.css` - Direct CSS output

## Why This Difference Exists

### Rolldown's ESM-First Approach

Rolldown treats **everything as ES modules**, including CSS. When you have a CSS entry point:

1. **Entry points must be valid ES modules** in Rolldown
2. CSS files aren't valid JavaScript modules
3. So Rolldown creates a **JS wrapper** that imports the CSS
4. This ensures consistent ESM behavior

### Rollup's Traditional Approach

Rollup has special handling for CSS entry points:
- Recognizes CSS as a special asset type
- Outputs CSS directly without a JS wrapper
- More traditional bundler behavior

## Does This Matter?

### For Your Plugin: ✅ NO

Both approaches work correctly because:

1. **The actual CSS file exists in both cases:**
   - Rolldown: `theme-C09nxUps.css` ✅
   - Rollup: `theme-CK6FhHUh.css` ✅

2. **Both are in the `assets/` directory** (flattened correctly)

3. **The manifest tells you where to find them:**
   - Rolldown: Check the `css` array
   - Rollup: Use the `file` directly

4. **Your Ruby code loads them correctly** either way

### For End Users: ✅ NO

The browser only cares about the **actual CSS file**, which exists in both cases:

```html
<!-- Both work the same way -->
<link rel="stylesheet" href="/vite/assets/theme-[hash].css">
```

## Is This a Bug?

❌ **No, this is intentional design**

- Rolldown: ESM-first consistency
- Rollup: Asset-type optimization

Both are valid approaches, and both produce working output.

## Should You Worry?

### ✅ No Concerns If:

- Your Ruby helper reads the manifest correctly ✅ (it does)
- CSS files end up in the right place ✅ (they do)
- Files load in the browser ✅ (they do)

### ⚠️ Only Matters If:

You have code that assumes CSS entry points always produce `.css` files directly. But since you use the manifest to look up files, this doesn't affect you!

## Conclusion

This difference is:
- ✅ **Expected** - Different bundler philosophies
- ✅ **Safe** - Both produce working CSS
- ✅ **Not a bug** - Intentional design
- ✅ **Not blocking** - Your plugin handles both correctly

**Your plugin correctly handles both approaches!** 🎉

---

## Technical Deep Dive (Optional)

### Rolldown's JS Wrapper Example

```javascript
// theme-Dk8Vp-QR.js (the entry point)
import "./theme-C09nxUps.css";
export {};
```

This is why:
1. The manifest shows `.js` as the `file`
2. The actual CSS is in the `css` array
3. When you import the entry, it loads the CSS

### Why Rolldown Does This

Rolldown is built for:
- Module Federation
- ESM consistency
- Cross-platform compatibility
- Rust-based performance

Treating CSS as importable ES modules enables these features!


