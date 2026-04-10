// =============================================================================
// configDefaults.js — August Estimator
// Derives the default editable config from pricingConfig.js.
// No duplication — just a one-time transformation at module load.
// =============================================================================

import {
  COMPLEXITY_MULTIPLIERS,
  CLIENT_SCALE_MULTIPLIERS,
  LOCATION_MULTIPLIERS,
  TIMELINE_MULTIPLIERS,
  BANDWIDTH_MULTIPLIERS,
  CATEGORIES,
  CLIENT_CONTRIBUTIONS,
} from './pricingConfig.js'

export function buildDefaultConfig() {
  // --- Service prices: flat map { [serviceId]: { low, high, floor } } ---
  const servicePrices = {}
  for (const cat of CATEGORIES) {
    if (cat.id === 'website_dev') {
      for (const plat of Object.values(cat.platforms)) {
        for (const svc of plat.services) {
          servicePrices[svc.id] = { low: svc.low, high: svc.high, floor: svc.floor }
        }
      }
    } else {
      for (const svc of cat.services ?? []) {
        servicePrices[svc.id] = { low: svc.low, high: svc.high, floor: svc.floor }
      }
    }
  }

  // --- Bundle ranges { [catId | 'website_dev_webflow' etc.]: { low, high } } ---
  // misc_design has bundleRange: null — omitted intentionally
  const bundleRanges = {}
  for (const cat of CATEGORIES) {
    if (cat.id === 'website_dev') {
      for (const plat of Object.values(cat.platforms)) {
        bundleRanges[`website_dev_${plat.id}`] = { ...plat.bundleRange }
      }
    } else if (cat.bundleRange) {
      bundleRanges[cat.id] = { ...cat.bundleRange }
    }
  }

  // --- Client contribution discounts { [contribId]: { [categoryId]: pct } } ---
  const clientContributionDiscounts = {}
  for (const contrib of CLIENT_CONTRIBUTIONS) {
    clientContributionDiscounts[contrib.id] = {}
    for (const d of contrib.discounts) {
      clientContributionDiscounts[contrib.id][d.categoryId] = d.pct
    }
  }

  return {
    // Plain object — { low, medium, high }
    complexityMultipliers: { ...COMPLEXITY_MULTIPLIERS },

    // Arrays of { id, multiplier } — labels stay in pricingConfig.js
    clientScaleMultipliers: CLIENT_SCALE_MULTIPLIERS.map(({ id, multiplier }) => ({ id, multiplier })),
    locationMultipliers:    LOCATION_MULTIPLIERS.map(({ id, multiplier }) => ({ id, multiplier })),
    timelineMultipliers:    TIMELINE_MULTIPLIERS.map(({ id, multiplier }) => ({ id, multiplier })),
    bandwidthMultipliers:   BANDWIDTH_MULTIPLIERS.map(({ id, multiplier }) => ({ id, multiplier })),

    servicePrices,
    bundleRanges,
    clientContributionDiscounts,
  }
}

export const DEFAULT_CONFIG = buildDefaultConfig()
