# August Estimator — Feature Implementation Plan

Three features documented below. Each is self-contained but shares a common constraint: all pricing logic lives in `pricingConfig.js` and `pricingEngine.js`; UI lives in components. That boundary should be preserved throughout.

---

## Completion Log

| Feature | Status | Shipped | Commit |
|---|---|---|---|
| Feature 1 — Scope Type Selector | ✅ Complete | Prior session | `c31c9e2` |
| Feature 2 — Email Design & Production | ✅ Complete | 2026-04-10 | `bfc3a55` |
| Feature 3 — Partner Arrangement | ✅ Complete (modified) | 2026-04-10 | `bfc3a55` |

**Feature 3 scope note (2026-04-10):** Prime/Sub was removed from scope — Gabriel confirmed this is already covered by the existing Contractors section. Shipped with Referral Fee (% / $ toggle, internal-only, excluded from clipboard) and Co-Agency (awareness-only, blue info card in result, NOTE line in clipboard) only.

**Styling changes shipped alongside (2026-04-10):**
- Discounts block moved directly above Grand Total, styled green
- Breakdown ranges now inline (`$X,XXX – $X,XXX`) instead of stacked
- Contractor row vertical padding tightened

---

## Feature 1 — Scope Type Selector ✅ COMPLETE

**Summary:** A global form toggle — `Full Engagement` vs `Campaign / Project` — that changes how services are priced. In Campaign mode, bundle logic is disabled and individual service ranges reflect standalone delivery costs (no shared-discovery amortization).

---

### Phase 1.1 — Decision Gate (requires Gabriel's input before any code)

**Decision 1: How should Campaign mode affect service ranges?**

Two architecturally distinct approaches:

- **Option A — Scalar modifier** (`CAMPAIGN_SCALAR`): A single multiplier (e.g. `1.12`) applied to all `low/high/floor` values in Campaign mode. Simple to maintain; approximate by nature. Floors become harder automatically.
- **Option B — Dual range sets per service**: Each service in `pricingConfig.js` gets a `campaignLow / campaignHigh / campaignFloor` alongside the existing fields. Precise per-service control; doubles the maintenance surface for pricing changes.
- **Option C — Per-category override objects**: A separate `CAMPAIGN_OVERRIDES` map in `pricingConfig.js` keyed by `serviceId`, only listing services that differ meaningfully from the scalar. Everything else inherits the scalar. Hybrid approach.

> **Gabriel's call required.** Recommendation: start with Option A (scalar), treat it as a forcing function to identify which services actually need their own campaign range, then graduate to Option C only if the scalar produces bad outputs on real estimates.

**Decision 2: Where does the toggle live in the form?**

Option A: Top of the form, above Project Basics — visible at all times, maximum prominence.
Option B: Inside Project Basics section alongside project name.

> **Gabriel's call required.**

---

### Phase 1.2 — `pricingConfig.js`

Files affected: `src/lib/pricingConfig.js`

- Export a new constant: `CAMPAIGN_STANDALONE_SCALAR` (e.g. `1.12`). This is the single value that makes Campaign mode standalone pricing harder.
- If Option B or C is chosen: add `campaignLow / campaignHigh / campaignFloor` to the services that need distinct values. These should be grouped in a comment block labeled `// Campaign / Project overrides`.
- The `ADDON_DISCOUNT` constant is irrelevant in Campaign mode — document that clearly in a comment.

No changes to `CATEGORIES` array structure or `bundleRange` fields — those are read but simply bypassed in Campaign mode.

---

### Phase 1.3 — `pricingEngine.js`

Files affected: `src/lib/pricingEngine.js`

Changes to `computeCategoryResult()`:
- Accept `scopeType` from `formData` (value: `'full'` or `'campaign'`).
- In the bundle check (`if (allSelected && bundleRange)`): gate this on `scopeType === 'full'`. In Campaign mode, the branch is never taken regardless of selection count.
- In the base range calculation (the `else` branch summing `low/high` per service): when `scopeType === 'campaign'`, source values from `campaignLow/High` (Option B/C) or multiply by `CAMPAIGN_STANDALONE_SCALAR` (Option A) after the standard sum.
- Floor enforcement: in Campaign mode, use the campaign-specific floor if it exists, otherwise the standard floor.

Changes to `calculateEstimate()`:
- Read `formData.scopeType` and pass it into `computeCategoryResult()` via `ctx` or as a direct argument.
- Add `scopeType` to the returned result object for display use in `EstimateResult`.

---

### Phase 1.4 — `configDefaults.js`

Files affected: `src/lib/configDefaults.js`

- If Option B/C: extend `buildDefaultConfig()` to extract `campaignPrices` alongside `servicePrices`, using the same flat-map pattern.
- If Option A: no changes needed — the scalar is a constant, not a configurable value.

---

### Phase 1.5 — Form State (`EstimatorForm.jsx`)

Files affected: `src/components/EstimatorForm.jsx`

- Add `scopeType: 'full'` to `DEFAULT_FORM`.
- Add a `ScopeTypeSelector` component (inline or extracted) rendered at the top of the form layout. Use the existing `ToggleGroup` pattern from bandwidth — two items: `Full Engagement` and `Campaign / Project`.
- Pass `scopeType` through `formData` to `calculateEstimate()` — no special wiring needed; it's already in `formData`.

---

### Phase 1.6 — `ServiceSelector.jsx`

Files affected: `src/components/ServiceSelector.jsx`

- When `scopeType === 'campaign'`: visually suppress the bundle callout (`hasBundle && bundleRange` block) — the bundle range display is misleading if bundle pricing won't apply.
- The badge logic (`allSelected && hasBundle ? 'Bundle' : ...`) should show count instead of "Bundle" in Campaign mode.
- This requires `formData.scopeType` to be passed into `CategoryAccordionItem`. It already receives `formData`, so no prop drilling needed.

---

### Phase 1.7 — `EstimateResult.jsx`

Files affected: `src/components/EstimateResult.jsx`

- Below the August Fee hero, show a small label: `Scope: Full Engagement` or `Scope: Campaign / Project` sourced from `result.scopeType`.
- In the copy-to-clipboard output, prepend the scope type to the header line.
- No structural changes to the breakdown display — Campaign mode produces the same line item shape, just different numbers.

---

### Phase 1.8 — Config Editor Integration

This phase is the crux of making Scope Type a first-class config-editable feature. The goal is that Gabriel can tune Campaign mode pricing from the Config Editor without touching code — the same way Full Engagement prices are tunable today.

**How the existing config system works (context for implementation):**

The config pipeline is: `pricingConfig.js` → `buildDefaultConfig()` → `DEFAULT_CONFIG` → `useConfigStore` (localStorage + shallow merge) → `ConfigEditor` (reads/writes) → `calculateEstimate(formData, config)` (consumes as override layer).

The shallow merge in `useConfigStore` is the critical safety mechanism:
```js
return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
```
Any new top-level key added to `DEFAULT_CONFIG` is automatically present in the runtime config for users who have an older stored config. This means **no `STORAGE_KEY` version bump is required** when adding Campaign mode fields — the merge handles it.

---

**Implementation diverges based on the Decision 1 option chosen in Phase 1.1:**

#### If Option A (scalar) is chosen:

**`configDefaults.js`:**
- Add `campaignScalar: CAMPAIGN_STANDALONE_SCALAR` as a new top-level key on the returned object from `buildDefaultConfig()`. This is a plain number (e.g. `1.12`), not a nested object.

**`pricingEngine.js`:**
- Read `config?.campaignScalar ?? CAMPAIGN_STANDALONE_SCALAR` in `calculateEstimate()` and pass it into `computeCategoryResult()` via `ctx`. When `scopeType === 'campaign'`, multiply the summed `baseLow/baseHigh` by this scalar after the standard sum.

**`ConfigEditor.jsx` — Multipliers tab:**
- Add a new entry to `MULTIPLIER_GROUPS`:
  ```js
  {
    key: 'campaignScalar',
    label: 'Campaign / Project Mode',
    type: 'scalar', // new type — handled as a single value, not an array or object
    rows: [{ id: 'standalone', label: 'Standalone delivery scalar' }],
  }
  ```
- Add a `scalar` branch to `MultipliersTab`'s render logic: read `config.campaignScalar` directly, commit via `onConfigChange({ ...config, campaignScalar: value })`. One row, one input — minimal surface.
- The `NumberInput` component is already set up for `step="0.01"` so no new components needed.
- Add a contextual note beneath the section: `"Applied to all service ranges in Campaign / Project mode. Does not affect bundle pricing (bundles are always disabled in Campaign mode)."`

**Scope of ConfigEditor changes: minimal.** One new row in the Multipliers tab. No new tab, no structural changes.

---

#### If Option B (dual range sets per service) is chosen:

**`configDefaults.js`:**
- Add a second flat map `campaignPrices` alongside `servicePrices`, built from `campaignLow/campaignHigh/campaignFloor` on each service in `pricingConfig.js`. Same iteration logic as `servicePrices`.
- Shape: `{ [serviceId]: { low, high, floor } }` — identical shape to `servicePrices`, just different values.

**`pricingEngine.js`:**
- Add `campaignPrices: config?.campaignPrices ?? null` to `ctx`.
- In `computeCategoryResult()`: when `scopeType === 'campaign'`, source the base range from `ctx.campaignPrices?.[s.id]` instead of `ctx.servicePrices?.[s.id]`, falling back to the static `campaignLow/campaignHigh` on the service object.

**`ConfigEditor.jsx` — new "Campaign Ranges" tab:**
- Add a fourth tab: `<TabsTrigger value="campaign">Campaign Ranges</TabsTrigger>`.
- The tab content is a `CampaignServicesTab` component — structurally identical to `ServicesTab`, but reads/writes `config.campaignPrices` instead of `config.servicePrices`. The `ServiceRow` and `ServiceTableHeader` components are reused without modification.
- Bundle rows are omitted entirely — Campaign mode has no bundle pricing, so `BundleRow` is not rendered.
- Add a note at the top: `"Ranges used in Campaign / Project mode. Bundle pricing is always disabled in this mode."`
- The `CATEGORIES` iteration in the existing `ServicesTab` already drives the accordion structure — `CampaignServicesTab` uses the same loop.

**Scope of ConfigEditor changes: moderate.** New tab, new `CampaignServicesTab` component (≈ 40 lines, largely copy of `ServicesTab`), and the `updateServicePrice` function targets `campaignPrices` instead of `servicePrices`.

---

#### If Option C (scalar + per-service overrides) is chosen:

This is a combination: a `campaignScalar` (as in Option A) in the Multipliers tab, plus a `campaignPrices` sparse map (as in Option B) in a new tab — but the Campaign Ranges tab only shows services that have a `CAMPAIGN_OVERRIDES` entry in `pricingConfig.js`. Services without an override inherit the scalar and are not shown.

In the ConfigEditor, the Campaign Ranges tab displays a note: `"These services have custom Campaign pricing that overrides the scalar. All other services use the scalar from the Multipliers tab."`

The `CATEGORIES` iteration in `CampaignServicesTab` filters: `cat.services.filter(svc => CAMPAIGN_OVERRIDES[svc.id])`.

---

**Decision gate for this phase:**

The choice made in Phase 1.1 Decision 1 directly determines the ConfigEditor architecture. Option A is one row in an existing tab. Option B is a new tab with ~40 lines of component code. Option C is both. Implementation should not start on Phase 1.8 until Phase 1.1 Decision 1 is locked.

---

**Reset behavior:**

The existing `handleReset()` in `ConfigEditor` calls `onReset()` → `resetConfig()` in `useConfigStore` → `setConfig(DEFAULT_CONFIG)`. Since Campaign mode config keys live in `DEFAULT_CONFIG`, they reset correctly alongside everything else. No additional reset handling needed.

**Key forcing `re-mount` on reset:**

The `key={resetKey}` pattern on the scrollable tab content div already causes all `NumberInput` components to re-mount, picking up fresh `defaultValue` props. Campaign mode inputs get this behavior for free since they'll live inside the same keyed container.

---

## Feature 2 — Email Design & Production Category ✅ COMPLETE

**Summary:** A new eighth category added to `pricingConfig.js` alongside the existing seven. No bundle pricing. Flow Design & Setup requires a sub-selector for flow type. Custom HTML Build triggers a subcontractor flag. Klaviyo is a third-party platform — account setup is a pass-through consideration.

---

### Phase 2.1 — Decision Gate (requires Gabriel's input before any code)

**Decision 1: How should Flow Design & Setup be priced?**

The four flow types (Welcome Series, Post-Purchase, Abandoned Cart, Win-back) have meaningfully different complexity. Three options:

- **Option A — Single service, quantity-like selector**: One checkbox for "Flow Design & Setup" with a sub-selector for "How many flows?" (1, 2, 3, 4+), priced by count. Does not distinguish which flows.
- **Option B — Four separate service checkboxes**: Each flow type is its own service with its own low/high/floor. Precise; the most flexible.
- **Option C — Single service with a flow-type selector that sets a complexity modifier**: One checkbox, then a sub-selector that picks a multiplier based on flow type (e.g., Welcome = 1.0, Post-Purchase = 0.9, Abandoned Cart = 1.1, Win-back = 1.2).

> **Gabriel's call required.** Recommendation: Option B (four checkboxes). It's consistent with how the rest of the tool handles distinct deliverables, and it means complexity toggles apply per-flow. Option C is a reasonable alternative if flows are always delivered as a package.

**Decision 2: Klaviyo account setup — how should it appear?**

Klaviyo is a third-party platform with its own costs (subscription, credits). Three options:

- **Excluded entirely** — not the agency's cost, just note it in flags.
- **Appear as a contractor/pass-through entry** in the existing Contractor panel (like Media Buying), billed at cost.
- **Appear as a flag only** in `evaluateFlags()` when any Klaviyo service is selected: "Note: Klaviyo subscription and sending costs are client's responsibility."

> **Gabriel's call required.** Recommendation: flag-only. Account setup is typically a client-facing vendor relationship, not an August deliverable.

**Decision 3: Should Email Template Design and Klaviyo Template Build be sold independently?**

They form a natural workflow pair (Figma design → Klaviyo build), but a client with existing templates may only need the build, and a client with a Klaviyo developer may only need the Figma design.

> **Gabriel's call required.** No mechanical constraint either way — just clarifies whether to add a flag when one is selected without the other.

---

### Phase 2.2 — `pricingConfig.js`

Files affected: `src/lib/pricingConfig.js`

Add a new export `EMAIL_DESIGN` constant:

```js
export const EMAIL_DESIGN = {
  id: 'email_design',
  label: 'Email Design & Production',
  bundleRange: null, // no bundle pricing, like misc_design
  services: [
    { id: 'email_template_design',  label: 'Email Template Design (Figma)',   low: ???, high: ???, floor: ??? },
    { id: 'klaviyo_template_build', label: 'Klaviyo Template Build',           low: ???, high: ???, floor: ??? },
    // If Option B:
    { id: 'flow_welcome',           label: 'Flow — Welcome Series',            low: ???, high: ???, floor: ??? },
    { id: 'flow_post_purchase',     label: 'Flow — Post-Purchase',             low: ???, high: ???, floor: ??? },
    { id: 'flow_abandoned_cart',    label: 'Flow — Abandoned Cart',            low: ???, high: ???, floor: ??? },
    { id: 'flow_winback',           label: 'Flow — Win-back',                  low: ???, high: ???, floor: ??? },
    { id: 'campaign_email',         label: 'Campaign Email (design + build)',   low: ???, high: ???, floor: ??? },
    { id: 'custom_html_build',      label: 'Custom HTML Build',                low: ???, high: ???, floor: ???, flag: 'high_complexity_subcontractor' },
  ],
}
```

> **Pricing values TBD — Gabriel to supply.** The `flag` field on `custom_html_build` is a new pattern (not currently used this way in the config); see Phase 2.4 for how it's consumed.

Append `EMAIL_DESIGN` to the `CATEGORIES` array.

---

### Phase 2.3 — `configDefaults.js`

Files affected: `src/lib/configDefaults.js`

No structural changes needed. The standard `else` branch in `buildDefaultConfig()` handles any category with a `services` array and `bundleRange: null`. The new category will be picked up automatically.

---

### Phase 2.4 — `pricingEngine.js`

Files affected: `src/lib/pricingEngine.js`

Changes to `evaluateFlags()`:
- Check if `email_design` services are selected and `custom_html_build` is among them → push flag: `"Custom HTML email build selected — confirm whether this will be subcontracted. Factor subcontractor cost into the Contractors panel."`
- If Klaviyo decision lands on flag-only (Decision 2): check if any `klaviyo_*` or `flow_*` service is selected → push flag: `"Klaviyo subscription and sending costs are the client's responsibility — not included in this estimate."`
- If Design/Build split decision lands on a flag (Decision 3): check for the orphaned-selection case and flag it.

No changes to `computeCategoryResult()` — the email category has no special modifiers (no page count tiers, no SKU tiers), so it runs through the standard path cleanly.

---

### Phase 2.5 — Form State (`EstimatorForm.jsx`)

Files affected: `src/components/EstimatorForm.jsx`

- Add `email_design: []` to `selectedServices` in `DEFAULT_FORM`.
- Add `email_design: 'medium'` to `complexity` in `DEFAULT_FORM`.

No other changes — the form passes `formData` through `calculateEstimate()` without category-specific handling.

---

### Phase 2.6 — `ServiceSelector.jsx`

Files affected: `src/components/ServiceSelector.jsx`

The new category renders through `CategoryAccordionItem` like any other — no structural changes needed for the standard service list.

If **Option C** (flow-type modifier) is chosen in Decision 1, a new `FlowTypeSelector` sub-component is needed, modeled after `TierSelector`, shown when any flow service is selected. This would require a new `formData.emailFlowType` field and a corresponding tier lookup in the engine.

If **Option B** (four separate services), no new UI components needed — the four flow types appear as standard `ServiceRow` checkboxes.

---

### Phase 2.7 — `EstimateResult.jsx`

Files affected: `src/components/EstimateResult.jsx`

No structural changes. The email category produces a standard line item (same shape as all others). It will appear in the breakdown automatically.

The `custom_html_build` flag surfaced by the engine will appear in the existing flags section.

---

## Feature 3 — Partner Arrangement Section ✅ COMPLETE (modified — see Completion Log)

**Summary:** A new form section (distinct from Contractors) handling three agency partnership structures: Referral Fee (internal deduction — never client-facing), Co-Agency (noted for awareness — no total impact), and Prime/Sub (partner executes under August's contract — rolls into grand total with editable markup).

---

### Phase 3.1 — Decision Gate (requires Gabriel's input before any code)

**Decision 1: Can multiple arrangement types coexist on one estimate?**

Example: A project might have a Prime/Sub partner executing work AND a referring broker expecting a referral fee. Are these mutually exclusive (select one), or can all three panels be open simultaneously?

> **Gabriel's call required.** Recommendation: allow multiple. The three types are economically non-overlapping (one is a deduction, one is a note, one is a cost roll-up). A radio button "select one" pattern loses expressiveness. Suggest three independent checkboxes, each opening its own panel — same pattern as the Contractor panel's check-to-expand behavior.

**Decision 2: Referral Fee — percentage or flat, or both?**

- **Percentage of August's fee** (most common): e.g. 10% of August Fee Low/High = referral deduction.
- **Flat dollar amount**: fixed fee back to the referrer.
- **Both modes, user selects**: a `%` / `$` toggle, matching how `customDiscountType` works in `PriceAdjustment`.

> **Gabriel's call required.** Recommendation: both modes with the same `%` / `$` toggle pattern already in the tool.

**Decision 3: Prime/Sub default markup rate**

The existing `ContractorPanel` uses `CONTRACTOR_MARKUP_RATE = 0.10` (10%) as the default. Prime/Sub arrangements typically run 15–20%. Should this default be a new named constant in `pricingConfig.js`, or just a different pre-filled default in the UI?

> **Gabriel's call required.** Recommendation: new constant `PRIME_SUB_MARKUP_RATE = 0.15` in `pricingConfig.js` — makes it visible and consistent.

**Decision 4: Co-Agency — what information is recorded?**

Minimum: partner name + approximate fee (for internal awareness). Is there any other context to log? (e.g., their scope description, contact name.)

> **Gabriel's call required.**

---

### Phase 3.2 — `pricingConfig.js`

Files affected: `src/lib/pricingConfig.js`

- Add export: `export const PRIME_SUB_MARKUP_RATE = 0.15`
- No other changes. Partner arrangement types are UI/engine concerns, not config concerns.

---

### Phase 3.3 — Form State (`EstimatorForm.jsx`)

Files affected: `src/components/EstimatorForm.jsx`

Add to `DEFAULT_FORM`:

```js
partnerArrangement: {
  referral: {
    active: false,
    referrerName: '',
    mode: '%',       // '%' or '$'
    value: '',
  },
  coAgency: {
    active: false,
    partnerName: '',
    approxFee: '',
    scopeNote: '',
  },
  primeSub: {
    active: false,
    partnerName: '',
    cost: '',
    markup: '15',    // default 15%, editable
    committed: false,
  },
}
```

Import and render a new `PartnerPanel` component in the form, placed after the Contractors section and before Discounts, within the "Resource Considerations" section — or as its own top-level `Section` block labeled "Partner Arrangement."

---

### Phase 3.4 — New Component: `PartnerPanel.jsx`

Files affected: `src/components/PartnerPanel.jsx` (new file)

Three independently checkable sub-panels, each opening on check:

**Referral Fee panel:**
- Referrer name field (text input)
- Mode toggle: `%` / `$` (reuse `ToggleGroup` pattern)
- Value input
- Helper text: "Internal only — excluded from client-facing output"

**Co-Agency panel:**
- Partner name field
- Approx fee field (informational only — does not roll into totals)
- Scope note textarea (optional)
- Helper text: "Partner invoices client directly — not included in your total"

**Prime/Sub panel:**
- Partner name field
- Cost input
- Markup input + `%` label (pre-filled to 15%)
- Add / commit button (same commit pattern as ContractorPanel)
- Helper text: "Rolls into grand total at cost + markup"

---

### Phase 3.5 — `pricingEngine.js`

Files affected: `src/lib/pricingEngine.js`

Changes to `calculateEstimate()`:

**Referral Fee:**
- Read `formData.partnerArrangement.referral`.
- If active and value > 0: compute `referralAmount` (flat or as % of `adjustedLow/High`).
- `yourNetLow = adjustedLow - referralAmount`, `yourNetHigh = adjustedHigh - referralAmount`.
- Does NOT affect `grandTotalLow/High` — the client pays the same; August simply nets less.
- Add to returned result: `referral: { active, referrerName, amount: referralAmount }`, `yourNetLow`, `yourNetHigh`.

**Co-Agency:**
- Read `formData.partnerArrangement.coAgency`.
- If active: add to returned result: `coAgency: { active, partnerName, approxFee, scopeNote }`.
- No math impact on any totals.

**Prime/Sub:**
- Read `formData.partnerArrangement.primeSub`.
- If active and committed and cost > 0: compute `markup = cost * markupRate`, `billed = cost + markup`.
- Add to `partnerTotal` alongside existing contractors: `partnerTotal += billed`.
- `grandTotalLow/High` already includes `partnerTotal`, so this rolls in automatically.
- Add to returned result: `primeSub: { active, partnerName, cost, markup, billed }`.

Add a flag in `evaluateFlags()`:
- If referral active and amount > 20% of `subtotalLow`: push `"Referral fee exceeds 20% of your fee — confirm this is intentional before proceeding."`

---

### Phase 3.6 — `EstimateResult.jsx`

Files affected: `src/components/EstimateResult.jsx`

**Visual output — Referral Fee:**
- Below the August Fee hero block, when `result.referral?.active`, show a new row:
  - `Referral Fee — [referrerName]: −$X,XXX` (styled like an applied discount row)
  - Below that: `Your Net: $X,XXX – $X,XXX` in a distinct label (muted, same weight as "CAD · before partner costs")
- This block is styled internally — different from the client-facing Grand Total.

**Visual output — Co-Agency:**
- Render as an amber flag (using the existing flag style from `evaluateFlags`) in the flags section. Text: `"Co-agency arrangement: [partnerName] will invoice the client separately for their scope (~$[approxFee])."`
- Alternatively, render as a distinct info card (blue/neutral instead of amber). Gabriel to decide tone.

**Visual output — Prime/Sub:**
- Appears in the existing "Partner Services" collapsible table as a distinct row, labeled `[partnerName] (Prime/Sub)` with cost → billed columns.
- The `Partner Total` tfoot row already sums all partner costs — Prime/Sub rolls in automatically since it's added to `partnerTotal` in the engine.

**Copy-to-clipboard output:**

The `handleCopy` function must be updated:

- **Referral Fee**: **excluded entirely** from copied text. No mention of referrer, fee, or Your Net in the clipboard string.
- **Co-Agency**: include as a note — e.g. `"NOTE: [partnerName] will invoice the client separately for their scope."` — placed after the Grand Total line.
- **Prime/Sub**: already included via the `contractors` loop (since it rolls into `partnerTotal`). Label it distinctly: `[partnerName] (Prime/Sub): $X,XXX cost → $X,XXX billed`.

---

### Phase 3.7 — Output Consistency Audit

After all three arrangement types are implemented, run through the following checklist before shipping:

- [ ] Referral Fee does not appear anywhere in clipboard output
- [ ] `Your Net` is only visible in the on-screen result panel, not in clipboard
- [ ] Co-Agency note appears in clipboard but does not affect any numeric total
- [ ] Prime/Sub billed amount is included in Grand Total in both on-screen and clipboard output
- [ ] Flags are included in clipboard output (existing behavior) — confirm referral-threshold flag is included
- [ ] Reset button clears all three partner arrangement fields
- [ ] Co-Agency approx fee field does not feed into any engine calculation

---

## Cross-Feature Notes

**Order of implementation:** Feature 2 (Email category) is the lowest-risk addition — it's additive-only and doesn't change existing engine logic. It should be implemented first. Feature 1 (Scope Type) touches the engine's core pricing path and should be implemented second, after pricing decisions are locked. Feature 3 (Partner Arrangement) is the most complex in terms of output differentiation and should be implemented last.

**ConfigEditor:** The existing `ConfigEditor.jsx` exposes editable fields from `buildDefaultConfig()`. Feature 1 (if using a scalar) and Feature 2 (new service price ranges) will automatically appear in the config editor through `servicePrices`. No explicit changes to `ConfigEditor.jsx` should be needed unless a new multiplier type is introduced.

**`useConfigStore.js`:** Not reviewed in detail, but any new config keys derived from `buildDefaultConfig()` will need to be persisted there if the config editor is meant to override them. Verify this after Phase 1.2 / 2.2.

**Decisions summary — all require Gabriel's input before code:**

| # | Feature | Decision |
|---|---------|----------|
| 1.A | Scope Type | Scalar vs dual range sets vs per-service overrides for Campaign mode |
| 1.B | Scope Type | Toggle placement: top of form or inside Project Basics |
| 2.A | Email | Flow Design & Setup: separate checkboxes vs quantity selector vs modifier |
| 2.B | Email | Klaviyo account setup: flag-only vs pass-through contractor entry |
| 2.C | Email | Design + Build: flag when selected independently, or always independent |
| 2.D | Email | Pricing values for all email services (Gabriel to supply numbers) |
| 3.A | Partner | Multiple arrangement types simultaneously, or mutually exclusive |
| 3.B | Partner | Referral fee: % mode, $ mode, or both with toggle |
| 3.C | Partner | Prime/Sub default markup rate (15% recommended) |
| 3.D | Partner | Co-Agency: what fields to capture beyond partner name + approx fee |
