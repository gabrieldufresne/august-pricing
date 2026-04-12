# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, hot reload)
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test suite exists. There is no TypeScript — the project is plain JavaScript (JSX).

## Deployment

Auto-deploys to Vercel on push to `main` at `https://github.com/gabrieldufresne/august-pricing.git`. No manual deploy step needed.

After pricing changes, bump `STORAGE_KEY` in `src/lib/useConfigStore.js` (e.g. `v2` → `v3`) to invalidate cached configs in users' localStorage. Failure to do this means users see stale pricing in the Config Editor.

## Architecture

Two-panel SPA: left is the form, right is the live estimate. No router, no backend, no API calls.

### Pricing data flow (critical to understand)

```
pricingConfig.js          — single source of truth for all numeric values
    ↓
configDefaults.js         — buildDefaultConfig() transforms config into a flat shape
    ↓
useConfigStore.js         — persists config to localStorage, exposes {config, setConfig, resetConfig}
    ↓
calculateEstimate(formData, config)   — pure function in pricingEngine.js
    ↓
EstimateResult.jsx        — displays result object
```

**Only edit `pricingConfig.js` to change pricing.** The engine and config system derive everything from it automatically. Never touch `pricingEngine.js` to adjust pricing values.

The `config` parameter in `calculateEstimate` is the override layer — it lets Config Editor changes take effect without modifying source files. `null` config falls back to static imports from `pricingConfig.js`.

### Key files

- `src/lib/pricingConfig.js` — all `low/high/floor` values, bundle ranges, multiplier tables, tier arrays. The only file to edit for pricing.
- `src/lib/pricingEngine.js` — pure `calculateEstimate(formData, config)` export. Contains `computeCategoryResult()` (per-category math) and `evaluateFlags()` (warnings). No React imports.
- `src/lib/configDefaults.js` — `buildDefaultConfig()` flattens pricingConfig into the shape consumed by the engine's config override layer.
- `src/lib/useConfigStore.js` — localStorage persistence under `august-estimator-config-vN`. Shallow merges stored config with `DEFAULT_CONFIG` so new keys added to the default are always present.
- `src/components/EstimatorForm.jsx` — holds `DEFAULT_FORM` state. Adding a new category requires entries in both `selectedServices` and `complexity`. Contains `ScopeTypeSelector` and `TimelineSection` as local components.
- `src/components/ServiceSelector.jsx` — renders all category accordions. Uses `TierSelector` for page count and SKU count sub-selectors. Platform selector for `website_dev` is also here.
- `src/components/EstimateResult.jsx` — reads the result object from the engine. `handleCopy()` builds the plaintext clipboard output. Referral fee is intentionally excluded from clipboard.
- `src/components/ConfigEditor.jsx` — slide-in panel with tabs for Services, Bundle Ranges, Multipliers. Reads/writes `config` via `onConfigChange` prop.

### Result object shape (engine output)

```js
{
  subtotalLow, subtotalHigh,      // pre-discount August fee
  augustFeeLow, augustFeeHigh,    // post-discount August fee
  grandTotalLow, grandTotalHigh,  // augustFee + partnerTotal
  lineItems[],                    // one per selected category
  appliedDiscounts[],             // global discounts
  contractors[],                  // committed contractor entries
  partnerTotal,
  referral: { active, amountLow, amountHigh, referrerName },
  yourNetLow, yourNetHigh,        // augustFee minus referral (internal only)
  coAgency: { active, partnerName, approxFee },
  scopeType,                      // 'full' | 'campaign'
  flags[],
}
```

### Scope types

`formData.scopeType === 'campaign'` disables bundle pricing and applies `CAMPAIGN_STANDALONE_SCALAR` (default 1.12) to all service ranges. The scalar is config-editable via the Multipliers tab.

### website_dev special case

The `website_dev` category is platform-gated (Webflow / Shopify / Sanity). Its services and bundle range are nested under `WEBSITE_DEV.platforms[platform]` in `pricingConfig.js`, not at the top level like other categories. The engine and selector both check `category.id === 'website_dev'` to resolve the correct service list.

### Adding a new service category

1. Define the constant in `pricingConfig.js` and append it to `CATEGORIES`.
2. Add `[catId]: []` to `selectedServices` and `[catId]: 'medium'` to `complexity` in `DEFAULT_FORM` (EstimatorForm.jsx).
3. `configDefaults.js`, the engine, and the service selector all iterate `CATEGORIES` — no changes needed there unless the category has non-standard pricing logic.

### Mobile floating bar (`src/components/FloatingEstimateBar.jsx`)

Fixed floating card at the bottom of the viewport on mobile/tablet (`lg:hidden`). Mounted via `AnimatePresence` in `App.jsx` when `result && !isEstimatePanelVisible`. Fades in/out with a simple opacity + y transition — **do not use Framer Motion `layoutId` or shared element transitions here, they are broken on iOS Safari.** An `IntersectionObserver` on the estimate panel wrapper ref in `App.jsx` drives the `isEstimatePanelVisible` boolean (15% threshold). Tapping opens a slide-up drawer showing line items and grand total.

### Estimate display — pre-discount vs post-discount

The August Fee hero shows `subtotalLow/High` (pre-discount). The Grand Total shows the fully discounted + partner cost figure. The discount badge in the Grand Total block is computed from `appliedDiscounts` values directly — **not** back-calculated from rounded dollar amounts, which would drift due to `roundTo500`.

### Form section order

Services → Client Contributions → Client Profile → Timeline → Resource Considerations → Partner Arrangement → Discounts.
