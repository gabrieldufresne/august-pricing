# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, hot reload)
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test suite. Plain JavaScript (JSX) — no TypeScript.

## Deployment

Auto-deploys to Vercel on push to `main` at `https://github.com/gabrieldufresne/august-pricing.git`.

After pricing changes, bump `STORAGE_KEY` in `src/lib/useConfigStore.js` (e.g. `v2` → `v3`) to invalidate cached configs in users' localStorage. Failure to do this means users see stale pricing in the Config Editor.

## Architecture

Two-panel SPA: left is the estimator form, right is the live estimate. No router, no backend, no API calls.

### Pricing data flow

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

**Only edit `pricingConfig.js` to change pricing.** Never touch `pricingEngine.js` to adjust pricing values — the engine derives everything from pricingConfig automatically.

The `config` parameter in `calculateEstimate` is the override layer from the Config Editor. `null` config falls back to static imports from `pricingConfig.js`.

### Key files

- `src/lib/pricingConfig.js` — all `low/high/floor` values, bundle ranges, multiplier tables, tier arrays. The only file to edit for pricing.
- `src/lib/pricingEngine.js` — pure `calculateEstimate(formData, config)` export. `computeCategoryResult()` handles per-category math; `evaluateFlags()` produces warnings. No React imports.
- `src/lib/configDefaults.js` — `buildDefaultConfig()` flattens pricingConfig into the shape consumed by the engine's config override layer.
- `src/lib/useConfigStore.js` — localStorage persistence under `august-estimator-config-vN`. Shallow merges stored config with `DEFAULT_CONFIG` so new keys are always present.
- `src/components/EstimatorForm.jsx` — holds `DEFAULT_FORM` state. Contains `ScopeTypeSelector` and `TimelineSection` as local components.
- `src/components/ServiceSelector.jsx` — renders all category accordions. `TierSelector` handles page count and SKU count sub-selectors. Platform selector for `website_dev` is also here.
- `src/components/EstimateResult.jsx` — reads engine result. `handleCopy()` builds the plaintext clipboard output. Referral fee is excluded from clipboard output.
- `src/components/ConfigEditor.jsx` — slide-in panel with tabs for Services, Bundle Ranges, Multipliers.

### Result object shape

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
3. `configDefaults.js`, the engine, and the service selector all iterate `CATEGORIES` — no changes needed unless the category has non-standard pricing logic (see `website_dev` and `misc_design` for examples).

### Mobile floating bar (`src/components/FloatingEstimateBar.jsx`)

Fixed at the bottom of the viewport on mobile/tablet (`lg:hidden`). Mounted via `AnimatePresence` in `App.jsx` when `result && !isEstimatePanelVisible`. An `IntersectionObserver` on the estimate panel wrapper ref drives `isEstimatePanelVisible` (15% threshold). Tapping opens a slide-up drawer with line items and grand total.

**Do not use Framer Motion `layoutId` or shared element transitions here — they are broken on iOS Safari.**

### Estimate display — pre-discount vs post-discount

The August Fee hero shows `subtotalLow/High` (pre-discount). Grand Total shows the fully discounted + partner cost figure. The discount badge is computed from `appliedDiscounts` values directly — not back-calculated from rounded dollar amounts (which would drift due to `roundTo500`).

### Estimate panel — receipt styling

Styled as a physical receipt. `ScallopedEdge` in `App.jsx` is an inline SVG path of alternating quadratic beziers filling `hsl(var(--background))`, creating a torn-paper bottom. `TicketSeparator` in `EstimateResult.jsx` is a dashed rule with punch-hole circles straddling the card edges via negative margins. Breakdown line items use a dotted-leader flex row pattern.

### Form section order

Scope Type → Project Basics → Services → Client Contributions → Timeline → Resource Considerations → Partner Arrangement → Discounts (8 sections).

### Section sticky stack

Each `Section` in EstimatorForm is `position: sticky` with `stickyTop` values in 44px increments: 56, 100, 144, 188, 232, 276, 320, 364. Later sections have higher `zIndex` (10 + stackIndex). Scroll-driven scale (1→0.97) and box-shadow are written to `useMotionValue`s directly via `scrollY.on('change')` in a `useEffect`. `stickyPointRef` (plain ref, not state) stores the natural offsetTop minus stickyTop — measured once in `useLayoutEffect`.

### Framer Motion patterns in use

- `whileInView` entrance (opacity 0→1, y 16→0, `once: true`) on each Section
- `layout` + `AnimatePresence` for inline `+5%` / `+15%` expansion on selected bandwidth buttons
- `AnimatePresence` height animation (`height: 0 → 'auto'`) on discount rows and flag items
- `whileTap={{ scale: 0.96/0.97 }}` spring on ToggleGroupItems, ServiceRows, and Buttons
- Grand total flash: `animate(ref, { opacity: [1, 0] })` via imported `animate` function on `grandTotalLow/High` change

### ClientContribution cards

`src/components/ClientContribution.jsx` — 2-column responsive card grid. Each card is a `motion.div` with `whileTap`, animated background color, and Phosphor icons (regular/duotone weight by active state). Selected state shows a `CheckCircle` badge top-right and discount pills below the description. Pills use a `CATEGORY_LABELS` map built from `CATEGORIES`. Discount percentages and target categories are sourced directly from `contrib.discounts` — no hardcoding in the component.
