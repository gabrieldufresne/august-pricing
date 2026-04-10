// =============================================================================
// pricingEngine.js — August Estimator
// Pure function: calculateEstimate(formData) → result
// No side effects. No imports from React. Edit pricingConfig.js, not this file.
// =============================================================================

import {
  CATEGORIES,
  WEBSITE_DEV,
  COMPLEXITY_MULTIPLIERS,
  CLIENT_SCALE_MULTIPLIERS,
  LOCATION_MULTIPLIERS,
  TIMELINE_MULTIPLIERS,
  BANDWIDTH_MULTIPLIERS,
  PAGE_COUNT_TIERS_DESIGN,
  PAGE_COUNT_TIERS_DEV,
  PAGE_COUNT_TIERS_LANDING,
  SKU_COUNT_TIERS,
  CLIENT_CONTRIBUTIONS,
  CONTRACTOR_MARKUP_RATE,
} from './pricingConfig.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundTo500(value) {
  return Math.round(value / 500) * 500
}

function getMultiplier(list, id, defaultValue = 1.0) {
  const match = list.find((item) => item.id === id)
  return match ? match.multiplier : defaultValue
}

// ---------------------------------------------------------------------------
// computeBusinessDays — counts Mon–Fri between two Date objects
// ---------------------------------------------------------------------------

export function computeBusinessDays(startDate, endDate) {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end <= start) return 0
  let days = 0
  const cursor = new Date(start)
  while (cursor < end) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days++
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

// ---------------------------------------------------------------------------
// getTimelineTier — returns the matching timeline object or null
// ---------------------------------------------------------------------------

export function getTimelineTier(businessDays) {
  if (businessDays === null) return null
  const tiers = TIMELINE_MULTIPLIERS
  if (businessDays < 20) return tiers.find((t) => t.id === 'rush')
  if (businessDays <= 39) return tiers.find((t) => t.id === 'compressed')
  return tiers.find((t) => t.id === 'standard')
}

// ---------------------------------------------------------------------------
// resolveCategoryServices — returns the active service list for a category
// For website_dev, platform must be selected first
// ---------------------------------------------------------------------------

function resolveCategoryServices(category, formData) {
  if (category.id === 'website_dev') {
    const platform = formData.websiteDevPlatform
    if (!platform || !WEBSITE_DEV.platforms[platform]) return []
    return WEBSITE_DEV.platforms[platform].services
  }
  return category.services
}

// ---------------------------------------------------------------------------
// resolveBundleRange — returns the active bundle range for a category
// ---------------------------------------------------------------------------

function resolveBundleRange(category, formData) {
  if (category.id === 'website_dev') {
    const platform = formData.websiteDevPlatform
    if (!platform || !WEBSITE_DEV.platforms[platform]) return null
    return WEBSITE_DEV.platforms[platform].bundleRange
  }
  return category.bundleRange
}

// ---------------------------------------------------------------------------
// computeCategoryResult — processes one category and returns a line item
// ---------------------------------------------------------------------------

function computeCategoryResult(category, formData, globalMult) {
  const catId = category.id
  const selectedIds = formData.selectedServices?.[catId] ?? []

  if (selectedIds.length === 0) return null

  const allServices = resolveCategoryServices(category, formData)
  const bundleRange = resolveBundleRange(category, formData)
  const allSelected = allServices.length > 0 && selectedIds.length === allServices.length
  const selectedServices = allServices.filter((s) => selectedIds.includes(s.id))

  // Step 1 — Base range
  let baseLow, baseHigh
  let isBundle = false

  if (allSelected && bundleRange) {
    baseLow = bundleRange.low
    baseHigh = bundleRange.high
    isBundle = true
  } else {
    baseLow = selectedServices.reduce((sum, s) => sum + s.low, 0)
    baseHigh = selectedServices.reduce((sum, s) => sum + s.high, 0)
  }

  // Step 2 — Client contribution discounts
  const activeContributions = formData.clientContributions ?? []
  const appliedDiscounts = []

  for (const toggleId of activeContributions) {
    const contribution = CLIENT_CONTRIBUTIONS.find((c) => c.id === toggleId)
    if (!contribution) continue

    for (const discount of contribution.discounts) {
      if (discount.categoryId !== catId) continue

      // If discount is scoped to a specific serviceId, only apply when that service is selected
      if (discount.serviceId && !selectedIds.includes(discount.serviceId)) continue

      // For bundle, apply discount to full range. For partial, apply proportionally.
      baseLow = baseLow * (1 - discount.pct)
      baseHigh = baseHigh * (1 - discount.pct)

      appliedDiscounts.push({ label: discount.label, pct: discount.pct })
    }
  }

  // Step 3 — Page count multiplier (Website Design)
  let pageMultiplier = 1.0
  if (catId === 'website_design') {
    const tier = formData.websiteDesignPageCount
    pageMultiplier = getMultiplier(PAGE_COUNT_TIERS_DESIGN, tier, 1.0)
  }

  // Step 3b — Page count multiplier (Website Dev)
  if (catId === 'website_dev') {
    const tier = formData.websiteDevPageCount
    pageMultiplier = getMultiplier(PAGE_COUNT_TIERS_DEV, tier, 1.0)
  }

  // Step 3c — Page count multiplier (Landing Page in Misc Design)
  let landingPageMultiplier = 1.0
  let skuMultiplier = 1.0

  // Step 4 — SKU multiplier (only applies per-service in Misc Design)
  // These are handled per-service below for misc_design, but we track here for bundling

  // For misc_design — per-service modifiers
  let miscLow = 0
  let miscHigh = 0
  const miscItemDetails = []

  if (catId === 'misc_design') {
    for (const svc of selectedServices) {
      let svcLow = svc.low
      let svcHigh = svc.high

      if (svc.modifier === 'page_count_landing') {
        const tierId = formData.landingPageCount
        landingPageMultiplier = getMultiplier(PAGE_COUNT_TIERS_LANDING, tierId, 1.0)
        // '4_plus' has null multiplier → redirect flag, treat as 1.0 for math
        const mult = landingPageMultiplier || 1.0
        svcLow = svcLow * mult
        svcHigh = svcHigh * mult
      }

      if (svc.modifier === 'sku_count') {
        const tierId = formData.packagingSkuCount
        skuMultiplier = getMultiplier(SKU_COUNT_TIERS, tierId, 1.0)
        const mult = skuMultiplier || 1.0
        svcLow = svcLow * mult
        svcHigh = svcHigh * mult
      }

      miscLow += svcLow
      miscHigh += svcHigh
      miscItemDetails.push({ ...svc, adjLow: svcLow, adjHigh: svcHigh })
    }

    baseLow = miscLow
    baseHigh = miscHigh
    pageMultiplier = 1.0 // already applied per-service
  }

  // Apply page count multiplier for non-misc categories
  if (catId !== 'misc_design') {
    baseLow = baseLow * pageMultiplier
    baseHigh = baseHigh * pageMultiplier
  }

  // Step 5 — Per-category complexity multiplier
  const complexityId = formData.complexity?.[catId] ?? 'medium'
  const complexityMult = COMPLEXITY_MULTIPLIERS[complexityId] ?? 1.0

  baseLow = baseLow * complexityMult
  baseHigh = baseHigh * complexityMult

  // Step 6 — Global multipliers
  baseLow = baseLow * globalMult
  baseHigh = baseHigh * globalMult

  // Step 7 — Enforce floor (per service or bundle floor)
  // For bundle: use sum of all service floors as the minimum
  const floorValue = selectedServices.reduce((sum, s) => sum + s.floor, 0)
  baseLow = Math.max(baseLow, floorValue)
  baseHigh = Math.max(baseHigh, floorValue)

  // Step 8 — Round to nearest $500
  const adjLow = roundTo500(baseLow)
  const adjHigh = roundTo500(baseHigh)

  // Determine combined multiplier for display
  const combinedMult = parseFloat((complexityMult * globalMult * pageMultiplier).toFixed(3))

  return {
    categoryId: catId,
    label: category.label,
    isBundle,
    complexity: complexityId,
    selectedServices: selectedServices.map((s) => s.label),
    baseLow: adjLow,
    baseHigh: adjHigh,
    adjLow,
    adjHigh,
    multiplier: combinedMult,
    discounts: appliedDiscounts,
    platform: catId === 'website_dev' ? formData.websiteDevPlatform : null,
  }
}

// ---------------------------------------------------------------------------
// evaluateFlags
// ---------------------------------------------------------------------------

function evaluateFlags(formData, lineItems) {
  const flags = []

  const timelineTier = getTimelineTier(
    computeBusinessDays(formData.startDate, formData.endDate)
  )
  const isRush = timelineTier?.id === 'rush'
  const isStretched = formData.bandwidth === 'stretched'
  const complexities = Object.values(formData.complexity ?? {})
  const hasHighComplexity = complexities.includes('high')
  const allLowComplexity = complexities.length > 0 && complexities.every((c) => c === 'low')
  const isEnterprise = formData.clientScale === 'enterprise'
  const landingPage4Plus = formData.landingPageCount === '4_plus'
  const sku7Plus = formData.packagingSkuCount === '7_plus'
  const overrideAmt = Math.abs(parseFloat(formData.customDiscountValue) || 0)
  const overrideType = formData.customDiscountType ?? '%'

  if (isRush && isStretched) {
    flags.push('Rush timeline with stretched capacity — confirm the team can absorb this before quoting.')
  }

  if (isRush && hasHighComplexity) {
    flags.push('High complexity on a rush timeline is high-risk. Validate the brief before committing.')
  }

  if (isEnterprise && allLowComplexity && lineItems.length > 0) {
    flags.push('Enterprise client with all Low complexity — confirm the brief is genuinely this clear.')
  }

  if (sku7Plus) {
    flags.push('7+ SKUs on packaging — too complex for a formula. Consider a custom quote.')
  }

  if (landingPage4Plus) {
    flags.push('4+ landing pages selected — redirect to Website Design category for accurate pricing.')
  }

  if (overrideAmt > 0) {
    // Convert to percentage for comparison
    let overridePct = 0
    if (overrideType === '%') {
      overridePct = overrideAmt
    } else {
      // $ override — calculate as % of subtotal (approximated from lineItems)
      const subtotalLow = lineItems.reduce((sum, l) => sum + l.adjLow, 0)
      if (subtotalLow > 0) overridePct = (overrideAmt / subtotalLow) * 100
    }
    if (overridePct > 30) {
      flags.push('Manual override exceeds 30% — double-check before sharing.')
    }
  }

  return flags
}

// ---------------------------------------------------------------------------
// calculateEstimate — main export
// ---------------------------------------------------------------------------

export function calculateEstimate(formData) {
  // ── Global multiplier ──────────────────────────────────────────────────────
  const scaleMult     = getMultiplier(CLIENT_SCALE_MULTIPLIERS, formData.clientScale, 1.0)
  const locationMult  = getMultiplier(LOCATION_MULTIPLIERS, formData.clientLocation, 1.0)
  const bandwidthMult = getMultiplier(BANDWIDTH_MULTIPLIERS, formData.bandwidth, 1.0)

  // Timeline: derive from dates, or fall back to explicit override
  let timelineMult = 1.0
  const businessDays = computeBusinessDays(formData.startDate, formData.endDate)
  const timelineTier = getTimelineTier(businessDays)
  timelineMult = timelineTier ? timelineTier.multiplier : 1.0

  const globalMult = scaleMult * locationMult * timelineMult * bandwidthMult

  // ── Per-category line items ───────────────────────────────────────────────
  const lineItems = []

  for (const category of CATEGORIES) {
    const result = computeCategoryResult(category, formData, globalMult)
    if (result) lineItems.push(result)
  }

  if (lineItems.length === 0) {
    return null // nothing selected
  }

  // ── August Fee Subtotal ────────────────────────────────────────────────────
  let subtotalLow  = lineItems.reduce((sum, l) => sum + l.adjLow, 0)
  let subtotalHigh = lineItems.reduce((sum, l) => sum + l.adjHigh, 0)

  // ── Discounts ─────────────────────────────────────────────────────────────
  const appliedDiscounts = []
  let discountPct = 0

  if (formData.discountFriendsFamily) {
    discountPct += 15
    appliedDiscounts.push({ label: 'Friends & family', type: '%', value: 15 })
  }
  if (formData.discountReturningClient) {
    discountPct += 10
    appliedDiscounts.push({ label: 'Returning client', type: '%', value: 10 })
  }

  const customDiscountValue  = parseFloat(formData.customDiscountValue) || 0
  const customDiscountType   = formData.customDiscountType ?? '%'
  const customDiscountReason = formData.customDiscountReason || null

  if (customDiscountValue > 0) {
    appliedDiscounts.push({
      label: customDiscountReason || 'Custom discount',
      type: customDiscountType,
      value: customDiscountValue,
    })
  }

  // Apply % discounts first
  let adjustedLow  = subtotalLow  * (1 - discountPct / 100)
  let adjustedHigh = subtotalHigh * (1 - discountPct / 100)

  // Apply custom discount
  if (customDiscountValue > 0) {
    if (customDiscountType === '%') {
      adjustedLow  = adjustedLow  * (1 - customDiscountValue / 100)
      adjustedHigh = adjustedHigh * (1 - customDiscountValue / 100)
    } else {
      adjustedLow  = adjustedLow  - customDiscountValue
      adjustedHigh = adjustedHigh - customDiscountValue
    }
  }

  adjustedLow  = roundTo500(Math.max(0, adjustedLow))
  adjustedHigh = roundTo500(Math.max(0, adjustedHigh))

  // ── Contractors ───────────────────────────────────────────────────────────
  const contractors = []
  const contractorInputs = formData.contractors ?? {}

  // If 'client_provides_photography' is active, remove photographer
  const activeContributions = formData.clientContributions ?? []
  const removeContractors = []
  for (const toggleId of activeContributions) {
    const contrib = CLIENT_CONTRIBUTIONS.find((c) => c.id === toggleId)
    if (contrib?.removeContractors) {
      removeContractors.push(...contrib.removeContractors)
    }
  }

  for (const [contractorId, entry] of Object.entries(contractorInputs)) {
    if (!entry || !entry.committed) continue
    if (removeContractors.includes(contractorId)) continue
    const costNum    = parseFloat(entry.cost) || 0
    if (costNum <= 0) continue
    const markupRate = (parseFloat(entry.markup) || CONTRACTOR_MARKUP_RATE * 100) / 100
    const markup     = costNum * markupRate
    const billed     = costNum + markup
    contractors.push({ id: contractorId, label: contractorId, cost: costNum, markup, billed })
  }

  const partnerTotal = contractors.reduce((sum, c) => sum + c.billed, 0)
  const grandTotalLow  = adjustedLow  + partnerTotal
  const grandTotalHigh = adjustedHigh + partnerTotal

  // ── Flags ──────────────────────────────────────────────────────────────────
  const flags = evaluateFlags(formData, lineItems)

  // ── Result object ──────────────────────────────────────────────────────────
  return {
    augustFeeLow:   adjustedLow,
    augustFeeHigh:  adjustedHigh,
    grandTotalLow,
    grandTotalHigh,
    currency: 'CAD',
    lineItems,
    subtotalLow,
    subtotalHigh,
    appliedDiscounts,
    contractors,
    partnerTotal,
    flags,
    meta: {
      globalMult,
      scaleMult,
      locationMult,
      timelineMult,
      bandwidthMult,
      businessDays,
      timelineTier: timelineTier?.id ?? null,
    },
  }
}
