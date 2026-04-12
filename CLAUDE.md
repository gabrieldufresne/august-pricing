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

Scope Type → Project Basics (includes Client Profile, no Notes field) → Services → Client Contributions → Timeline → Resource Considerations → Partner Arrangement → Discounts.

Client Profile (client scale + location) was merged into Project Basics. Notes field was removed from the UI (field stays in state/clipboard output). 8 sections total, down from 9.

### Section sticky stack

Each `Section` in EstimatorForm is `position: sticky` with `stickyTop` values in 44px increments: 56, 100, 144, 188, 232, 276, 320, 364. Later sections have higher `zIndex` (10 + stackIndex). Scroll-driven scale (1→0.97) and box-shadow deepen via `scrollY.on('change')` subscribed in a `useEffect`, writing to `useMotionValue`s directly. `stickyPointRef` (a plain ref, not state) stores the natural offsetTop minus stickyTop — measured once in `useLayoutEffect`.

### Estimate panel — receipt styling

The right-column estimate panel is styled as a receipt card:
- **No border, no bottom border-radius** (`rounded-t-xl bg-card`, border removed). Card reads against the warm off-white page background without a stroke.
- **ScallopedEdge** (`src/App.jsx`): inline SVG as the last child of the panel wrapper. Generates a path of alternating up/down quadratic beziers (20px wave period) filled with `hsl(var(--background))`, creating a torn-receipt bottom edge. Uses negative margins to bleed full card width.
- **TicketSeparator** (`src/components/EstimateResult.jsx`): dashed rule with `bg-background` punch-hole circles (no border) that straddle the card edge via `-mx-6`. Used twice — between August Fee hero and Breakdown, and between action buttons and Grand Total.
- **Grand Total** sits last in the result, on white background (dark theme removed). Text uses `text-foreground` / `text-muted-foreground`.
- **Breakdown line items** use a dotted leader pattern: `flex items-end` row with a `flex-1 border-b border-dotted border-border/50` spacer between label and price.

### Framer Motion patterns in use

- `whileInView` entrance (opacity 0→1, y 16→0, `once: true`) on each Section
- `layout` + `AnimatePresence` for bandwidth toggle width expansion (shows `+5%` / `+15%` inside button when selected)
- `AnimatePresence` height animation (`height: 0 → 'auto'`) on discount rows and flag items
- `whileTap={{ scale: 0.96/0.97 }}` spring on ToggleGroupItems, ServiceRows, and Buttons
- Grand total flash: `animate(ref, { opacity: [1, 0] })` via imported `animate` function watching `grandTotalLow/High`

### ClientContribution cards

`src/components/ClientContribution.jsx` — 2×2 responsive card grid (single col below `sm`). Each card is a `motion.div` with `whileTap`, `animate` background color, and Phosphor icons (regular/duotone weight toggle). Selected state shows a `CheckCircle` badge top-right and discount pills below the description. Pills use `CATEGORY_LABELS` lookup built from `CATEGORIES`.

### Bandwidth toggle

Internal bandwidth toggles in Resource Considerations show `+5%` / `+15%` inline when selected (derived from multiplier), animated with Framer Motion `layout` + `AnimatePresence`. The external description `<p>` below the toggle group was removed. The `Open` toggle is unchanged.
