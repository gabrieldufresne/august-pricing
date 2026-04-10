// =============================================================================
// pricingConfig.js — August Estimator · Single source of truth
// Edit values in this file only. Never touch pricingEngine.js for pricing.
// =============================================================================

// ---------------------------------------------------------------------------
// Global constants
// ---------------------------------------------------------------------------

export const HOURLY_RATE_REFERENCE = 180 // CAD — reference only, not used in math
export const CONTRACTOR_MARKUP_RATE = 0.10 // 10% applied to all contractor costs
export const ADDON_DISCOUNT = 0.08 // 8% discount per additional service within a category

// ---------------------------------------------------------------------------
// Complexity multipliers (per-category)
// ---------------------------------------------------------------------------

export const COMPLEXITY_MULTIPLIERS = {
  low: 0.90,
  medium: 1.00,
  high: 1.25,
}

// ---------------------------------------------------------------------------
// Global multipliers
// ---------------------------------------------------------------------------

export const CLIENT_SCALE_MULTIPLIERS = [
  { id: 'startup',    label: 'Startup / Individual',   multiplier: 0.85 },
  { id: 'small',      label: 'Small Business',          multiplier: 1.00 },
  { id: 'midsize',    label: 'Mid-size Company',        multiplier: 1.20 },
  { id: 'enterprise', label: 'Enterprise / Funded',     multiplier: 1.45 },
]

export const LOCATION_MULTIPLIERS = [
  { id: 'montreal',      label: 'Montreal',       multiplier: 1.00 },
  { id: 'toronto',       label: 'Toronto',        multiplier: 1.10 },
  { id: 'other_canada',  label: 'Other Canada',   multiplier: 1.00 },
  { id: 'us',            label: 'United States',  multiplier: 1.20 },
  { id: 'international', label: 'International',  multiplier: 1.15 },
]

export const TIMELINE_MULTIPLIERS = [
  { id: 'standard',   label: 'Standard',    minDays: 40,  maxDays: null, multiplier: 1.00 },
  { id: 'compressed', label: 'Compressed',  minDays: 20,  maxDays: 39,   multiplier: 1.15 },
  { id: 'rush',       label: 'Rush',        minDays: null, maxDays: 19,  multiplier: 1.30 },
]

export const BANDWIDTH_MULTIPLIERS = [
  { id: 'open',     label: 'Open',     description: 'No adjustment',                multiplier: 1.00 },
  { id: 'moderate', label: 'Moderate', description: '+5%',                           multiplier: 1.05 },
  { id: 'stretched',label: 'Stretched',description: 'Team is at near-capacity +15%', multiplier: 1.15 },
]

// ---------------------------------------------------------------------------
// Page count tiers (Website Design + Website Dev)
// ---------------------------------------------------------------------------

export const PAGE_COUNT_TIERS_DESIGN = [
  { id: '1_5',   label: '1–5 pages',   multiplier: 0.60 },
  { id: '6_10',  label: '6–10 pages',  multiplier: 0.80 },
  { id: '11_20', label: '11–20 pages', multiplier: 1.00 },
  { id: '20_plus',label: '20+ pages',  multiplier: 1.25 },
]

export const PAGE_COUNT_TIERS_DEV = [
  { id: '1_5',   label: '1–5 pages',   multiplier: 0.50 },
  { id: '6_10',  label: '6–10 pages',  multiplier: 0.75 },
  { id: '11_20', label: '11–20 pages', multiplier: 1.00 },
  { id: '20_plus',label: '20+ pages',  multiplier: 1.20 },
]

export const PAGE_COUNT_TIERS_LANDING = [
  { id: '1',    label: '1 page',   multiplier: 1.00 },
  { id: '2_3',  label: '2–3 pages',multiplier: 1.60 },
  { id: '4_plus',label: '4+ pages', multiplier: null, flag: 'redirect_website_design' },
]

// ---------------------------------------------------------------------------
// SKU count tiers (Packaging in Misc Design)
// ---------------------------------------------------------------------------

export const SKU_COUNT_TIERS = [
  { id: '1',    label: '1 SKU',   multiplier: 1.00 },
  { id: '2_3',  label: '2–3 SKUs',multiplier: 1.75 },
  { id: '4_6',  label: '4–6 SKUs',multiplier: 2.40 },
  { id: '7_plus',label: '7+ SKUs', multiplier: null, flag: 'custom_quote' },
]

// ---------------------------------------------------------------------------
// Category 1 — Brand Strategy
// ---------------------------------------------------------------------------

export const BRAND_STRATEGY = {
  id: 'brand_strategy',
  label: 'Brand Strategy',
  bundleRange: { low: 25000, high: 55000 },
  services: [
    { id: 'brand_positioning',    label: 'Brand Positioning',      low: 8000, high: 18000, floor: 4000 },
    { id: 'naming',               label: 'Naming',                 low: 6000, high: 14000, floor: 3000 },
    { id: 'brand_architecture',   label: 'Brand Architecture',     low: 5000, high: 12000, floor: 2500 },
    { id: 'messaging_framework',  label: 'Messaging Framework',    low: 5000, high: 12000, floor: 2500 },
    { id: 'tone_of_voice',        label: 'Tone of Voice Manual',   low: 4000, high: 10000, floor: 2000 },
    { id: 'persona_development',  label: 'Persona Development',    low: 3000, high:  8000, floor: 1500 },
    { id: 'competitive_analysis', label: 'Competitive Analysis',   low: 3000, high:  7000, floor: 1500 },
    { id: 'gtm_strategy',         label: 'Go-to-Market Strategy',  low: 6000, high: 15000, floor: 3000 },
  ],
}

// ---------------------------------------------------------------------------
// Category 2 — Visual Identity
// ---------------------------------------------------------------------------

export const VISUAL_IDENTITY = {
  id: 'visual_identity',
  label: 'Visual Identity',
  bundleRange: { low: 18000, high: 45000 },
  services: [
    { id: 'logo_design',          label: 'Logo Design',                  low: 5000, high: 12000, floor: 2500 },
    { id: 'color_system',         label: 'Color System',                 low: 2000, high:  5000, floor: 1000 },
    { id: 'typography_system',    label: 'Typography System',            low: 2000, high:  5000, floor: 1000 },
    { id: 'brand_guidelines',     label: 'Brand Guidelines',             low: 4000, high: 10000, floor: 2000 },
    { id: 'layout_grid',          label: 'Layout / Grid System',         low: 3000, high:  8000, floor: 1500 },
    { id: 'iconography',          label: 'Iconography',                  low: 3000, high:  8000, floor: 1500 },
    { id: 'illustration_direction',label: 'Illustration Direction',      low: 3000, high:  8000, floor: 1500 },
    { id: 'brand_app_templates',  label: 'Brand Application Templates',  low: 4000, high: 10000, floor: 2000 },
  ],
}

// ---------------------------------------------------------------------------
// Category 3 — Website Design
// ---------------------------------------------------------------------------

export const WEBSITE_DESIGN = {
  id: 'website_design',
  label: 'Website Design',
  bundleRange: { low: 18000, high: 45000 },
  pageCountTiers: PAGE_COUNT_TIERS_DESIGN,
  services: [
    { id: 'info_architecture',    label: 'Information Architecture',         low: 3000, high:  7000, floor: 1500 },
    { id: 'ux_wireframes',        label: 'UX / Wireframes',                  low: 4000, high: 10000, floor: 2000 },
    { id: 'ui_desktop',           label: 'UI Design — Desktop',              low: 6000, high: 18000, floor: 1500 },
    { id: 'ui_mobile',            label: 'UI Design — Mobile',               low: 3000, high:  8000, floor: 1000 },
    { id: 'design_system',        label: 'Design System / Component Library',low: 5000, high: 12000, floor: 2500 },
    { id: 'art_direction',        label: 'Art Direction',                    low: 3000, high:  8000, floor: 1500 },
    { id: 'prototype_handoff',    label: 'Prototype / Dev Handoff',          low: 2000, high:  5000, floor: 1000 },
  ],
}

// ---------------------------------------------------------------------------
// Category 4 — Website Development (platform-gated)
// ---------------------------------------------------------------------------

export const WEBSITE_DEV = {
  id: 'website_dev',
  label: 'Website Development',
  pageCountTiers: PAGE_COUNT_TIERS_DEV,
  platforms: {
    webflow: {
      id: 'webflow',
      label: 'Webflow',
      bundleRange: { low: 15000, high: 40000 },
      services: [
        { id: 'wf_base_build',       label: 'Base Build & CMS Setup',               low: 8000, high: 20000, floor: 4000 },
        { id: 'wf_interactions',     label: 'Custom Interactions / Animations',      low: 4000, high: 12000, floor: 2000 },
        { id: 'wf_integrations',     label: 'Third-Party Integrations (CRM, APIs)', low: 3000, high: 10000, floor: 1500 },
        { id: 'wf_multilang',        label: 'Multi-Language / Translation Layer',    low: 3000, high:  8000, floor: 1500 },
        { id: 'wf_seo',              label: 'SEO Foundation & Metadata',             low: 3000, high:  7000, floor: 1500 },
        { id: 'wf_analytics',        label: 'Analytics Setup (GA4)',                 low: 1500, high:  4000, floor:  750 },
        { id: 'wf_training',         label: 'CMS Training & Documentation',          low: 1500, high:  3500, floor:  750 },
      ],
    },
    shopify: {
      id: 'shopify',
      label: 'Shopify',
      bundleRange: { low: 18000, high: 50000 },
      services: [
        { id: 'sh_theme_build',      label: 'Theme Build & Store Setup',             low: 10000, high: 25000, floor: 5000 },
        { id: 'sh_ecommerce',        label: 'E-commerce Functionality',              low:  5000, high: 15000, floor: 2500 },
        { id: 'sh_integrations',     label: 'App & Third-Party Integrations',        low:  3000, high: 10000, floor: 1500 },
        { id: 'sh_liquid',           label: 'Custom Liquid / Metafield Work',        low:  4000, high: 12000, floor: 2000 },
        { id: 'sh_seo',              label: 'SEO Foundation & Metadata',             low:  3000, high:  7000, floor: 1500 },
        { id: 'sh_analytics',        label: 'Analytics Setup (GA4 / Pixel)',         low:  1500, high:  4000, floor:  750 },
        { id: 'sh_training',         label: 'Admin Training & Documentation',        low:  1500, high:  3500, floor:  750 },
      ],
    },
    sanity: {
      id: 'sanity',
      label: 'Sanity',
      bundleRange: { low: 20000, high: 55000 },
      services: [
        { id: 'sa_studio_setup',     label: 'Sanity Studio Setup & Schema Design',   low: 10000, high: 25000, floor: 5000 },
        { id: 'sa_frontend',         label: 'Frontend Build (Next.js / Astro)',       low: 12000, high: 30000, floor: 6000 },
        { id: 'sa_integrations',     label: 'Third-Party Integrations',              low:  4000, high: 12000, floor: 2000 },
        { id: 'sa_custom_tool',      label: 'Custom Tool / App within Site',         low:  8000, high: 25000, floor: 4000 },
        { id: 'sa_seo',              label: 'SEO Foundation & Metadata',             low:  3000, high:  7000, floor: 1500 },
        { id: 'sa_analytics',        label: 'Analytics Setup (GA4)',                 low:  1500, high:  4000, floor:  750 },
        { id: 'sa_training',         label: 'CMS Training & Documentation',          low:  2000, high:  4500, floor: 1000 },
      ],
    },
  },
}

// ---------------------------------------------------------------------------
// Category 5 — Copywriting & Content
// ---------------------------------------------------------------------------

export const COPYWRITING = {
  id: 'copywriting',
  label: 'Copywriting & Content',
  bundleRange: { low: 10000, high: 28000 },
  services: [
    { id: 'website_copy',       label: 'Website Copywriting (full site)', low: 5000, high: 14000, floor: 2000 },
    { id: 'brand_messaging',    label: 'Brand Messaging / Taglines',      low: 3000, high:  8000, floor: 1500 },
    { id: 'campaign_copy',      label: 'Campaign Copy',                   low: 3000, high: 10000, floor: 1500 },
    { id: 'content_strategy',   label: 'Content Strategy',                low: 5000, high: 12000, floor: 2500 },
    { id: 'content_pillars',    label: 'Content Pillars & Frameworks',    low: 3000, high:  8000, floor: 1500 },
    { id: 'social_copy',        label: 'Social Copy Package',             low: 2000, high:  6000, floor: 1000 },
    { id: 'email_templates',    label: 'Email / Newsletter Templates',    low: 2000, high:  6000, floor: 1000 },
  ],
}

// ---------------------------------------------------------------------------
// Category 6 — PR & Communications
// ---------------------------------------------------------------------------

export const PR_COMMS = {
  id: 'pr_comms',
  label: 'PR & Communications',
  bundleRange: { low: 15000, high: 40000 },
  services: [
    { id: 'media_strategy',     label: 'Media Strategy & Planning',          low: 5000, high: 14000, floor: 2500 },
    { id: 'press_release',      label: 'Press Release (writing + distribution)', low: 2000, high: 5000, floor: 1000 },
    { id: 'media_kit',          label: 'Media Kit (digital + print)',        low: 3000, high:  8000, floor: 1500 },
    { id: 'media_pitch',        label: 'Media Pitch Writing',                low: 2500, high:  7000, floor: 1250 },
    { id: 'media_list',         label: 'Media List Development',             low: 2000, high:  5000, floor: 1000 },
    { id: 'media_outreach',     label: 'Media Outreach & Relations',         low: 5000, high: 14000, floor: 2500 },
    { id: 'exec_profiling',     label: 'Executive Profiling & Bios',         low: 2000, high:  6000, floor: 1000 },
    { id: 'crisis_comms',       label: 'Crisis Communications Framework',    low: 5000, high: 15000, floor: 2500 },
    { id: 'awards_submission',  label: 'Awards Submission Strategy',         low: 2000, high:  6000, floor: 1000 },
    { id: 'speaking_opps',      label: 'Speaking Opportunity Development',   low: 3000, high:  8000, floor: 1500 },
    { id: 'influencer_relations',label: 'Influencer Relations Strategy',     low: 4000, high: 10000, floor: 2000 },
    { id: 'media_monitoring',   label: 'Media Monitoring Setup',             low: 2000, high:  5000, floor: 1000 },
  ],
}

// ---------------------------------------------------------------------------
// Category 7 — Misc Design (no bundle)
// ---------------------------------------------------------------------------

export const MISC_DESIGN = {
  id: 'misc_design',
  label: 'Misc Design',
  bundleRange: null, // no bundle pricing
  services: [
    { id: 'landing_page',     label: 'Landing Page Design',           low: 2500, high:  8000, floor:  750, modifier: 'page_count_landing' },
    { id: 'packaging',        label: 'Packaging Design',              low: 4000, high: 12000, floor: 1500, modifier: 'sku_count' },
    { id: 'pitch_deck',       label: 'Presentation / Pitch Deck Design', low: 3000, high: 8000, floor: 1500, modifier: null },
    { id: 'social_templates', label: 'Social Media Creative Templates',  low: 2000, high: 6000, floor: 1000, modifier: null },
    { id: 'print_collateral', label: 'Print Collateral',              low: 2000, high:  7000, floor: 1000, modifier: null },
    { id: 'digital_ad',       label: 'Digital Ad Creative',           low: 2000, high:  6000, floor: 1000, modifier: null },
    { id: 'trade_show',       label: 'Trade Show / Event Materials',  low: 3000, high:  8000, floor: 1500, modifier: null },
  ],
}

// ---------------------------------------------------------------------------
// All categories (ordered)
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  BRAND_STRATEGY,
  VISUAL_IDENTITY,
  WEBSITE_DESIGN,
  WEBSITE_DEV,
  COPYWRITING,
  PR_COMMS,
  MISC_DESIGN,
]

// ---------------------------------------------------------------------------
// Client Contribution Discounts
// Applied to the base range before other multipliers
// ---------------------------------------------------------------------------

export const CLIENT_CONTRIBUTIONS = [
  {
    id: 'existing_brand_assets',
    label: 'Existing brand assets provided',
    description: 'Client provides logos, guidelines, or visual system',
    discounts: [
      { categoryId: 'visual_identity', pct: 0.25, label: 'Existing brand assets' },
      { categoryId: 'website_design',  pct: 0.15, label: 'Existing brand assets' },
    ],
  },
  {
    id: 'client_provides_copy',
    label: 'Client provides copy & written content',
    description: 'Client writes or supplies all text content',
    discounts: [
      { categoryId: 'copywriting',    pct: 0.40, label: 'Client-supplied copy' },
      { categoryId: 'website_design', pct: 0.10, label: 'Client-supplied copy' },
    ],
  },
  {
    id: 'client_provides_photography',
    label: 'Client provides photography & imagery',
    description: 'Client supplies photo/video assets; removes photographer from contractor list',
    discounts: [
      { categoryId: 'website_design', pct: 0.15, label: 'Client-supplied photography', serviceId: 'art_direction' },
    ],
    removeContractors: ['photographer'],
  },
  {
    id: 'technical_brief_provided',
    label: 'Technical brief / specs provided',
    description: 'Detailed technical requirements doc supplied upfront',
    discounts: [
      { categoryId: 'website_dev', pct: 0.10, label: 'Technical brief provided' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Contractors
// ---------------------------------------------------------------------------

export const CONTRACTORS = [
  { id: 'photographer',  label: 'Photographer',         passThrough: false },
  { id: 'videographer',  label: 'Videographer',         passThrough: false },
  { id: 'copywriter',    label: 'Copywriter',           passThrough: false },
  { id: 'developer',     label: 'Developer',            passThrough: false },
  { id: 'illustrator',   label: 'Illustrator',          passThrough: false },
  { id: 'media_buying',  label: 'Media Buying',         passThrough: true  },
  { id: 'print_production', label: 'Printer / Production', passThrough: true },
]
