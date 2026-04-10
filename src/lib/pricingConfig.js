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
export const CAMPAIGN_STANDALONE_SCALAR = 1.12 // Applied to service ranges in Campaign / Project mode (no bundles, standalone delivery)

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
  bundleRange: { low: 26000, high: 38000 },
  services: [
    { id: 'brand_positioning',    label: 'Brand Positioning',      low: 6500, high:  9000, floor: 3500 },
    { id: 'naming',               label: 'Naming',                 low: 5000, high:  7000, floor: 2500 },
    { id: 'brand_architecture',   label: 'Brand Architecture',     low: 4000, high:  6000, floor: 2000 },
    { id: 'messaging_framework',  label: 'Messaging Framework',    low: 4000, high:  6000, floor: 2000 },
    { id: 'tone_of_voice',        label: 'Tone of Voice Manual',   low: 3500, high:  5000, floor: 1750 },
    { id: 'persona_development',  label: 'Persona Development',    low: 2500, high:  3500, floor: 1250 },
    { id: 'competitive_analysis', label: 'Competitive Analysis',   low: 2500, high:  3500, floor: 1250 },
    { id: 'gtm_strategy',         label: 'Go-to-Market Strategy',  low: 5000, high:  7500, floor: 2500 },
  ],
}

// ---------------------------------------------------------------------------
// Category 2 — Visual Identity
// ---------------------------------------------------------------------------

export const VISUAL_IDENTITY = {
  id: 'visual_identity',
  label: 'Visual Identity',
  bundleRange: { low: 17000, high: 26000 },
  services: [
    { id: 'logo_design',          label: 'Logo Design',                  low: 4500, high:  6500, floor: 2250 },
    { id: 'color_system',         label: 'Color System',                 low: 1500, high:  2500, floor:  750 },
    { id: 'typography_system',    label: 'Typography System',            low: 1500, high:  2500, floor:  750 },
    { id: 'brand_guidelines',     label: 'Brand Guidelines',             low: 3500, high:  5500, floor: 1750 },
    { id: 'layout_grid',          label: 'Layout / Grid System',         low: 2000, high:  3000, floor: 1000 },
    { id: 'iconography',          label: 'Iconography',                  low: 2500, high:  4000, floor: 1250 },
    { id: 'illustration_direction',label: 'Illustration Direction',      low: 2500, high:  4000, floor: 1250 },
    { id: 'brand_app_templates',  label: 'Brand Application Templates',  low: 3500, high:  5500, floor: 1750 },
  ],
}

// ---------------------------------------------------------------------------
// Category 3 — Website Design
// ---------------------------------------------------------------------------

export const WEBSITE_DESIGN = {
  id: 'website_design',
  label: 'Website Design',
  bundleRange: { low: 18000, high: 27000 },
  pageCountTiers: PAGE_COUNT_TIERS_DESIGN,
  services: [
    { id: 'info_architecture',    label: 'Information Architecture',         low: 2000, high:  3000, floor: 1000 },
    { id: 'ux_wireframes',        label: 'UX / Wireframes',                  low: 3500, high:  5500, floor: 1750 },
    { id: 'ui_desktop',           label: 'UI Design — Desktop',              low: 5500, high:  8000, floor: 1500 },
    { id: 'ui_mobile',            label: 'UI Design — Mobile',               low: 2500, high:  3500, floor:  750 },
    { id: 'design_system',        label: 'Design System / Component Library',low: 4500, high:  6500, floor: 2250 },
    { id: 'art_direction',        label: 'Art Direction',                    low: 2500, high:  4000, floor: 1250 },
    { id: 'prototype_handoff',    label: 'Prototype / Dev Handoff',          low: 1750, high:  2500, floor:  750 },
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
      bundleRange: { low: 15500, high: 24000 },
      services: [
        { id: 'wf_base_build',       label: 'Base Build & CMS Setup',               low: 7000, high: 10000, floor: 3500 },
        { id: 'wf_interactions',     label: 'Custom Interactions / Animations',      low: 3500, high:  5500, floor: 1750 },
        { id: 'wf_integrations',     label: 'Third-Party Integrations (CRM, APIs)', low: 2500, high:  4000, floor: 1250 },
        { id: 'wf_multilang',        label: 'Multi-Language / Translation Layer',    low: 2500, high:  3500, floor: 1250 },
        { id: 'wf_seo',              label: 'SEO Foundation & Metadata',             low: 2000, high:  3000, floor: 1000 },
        { id: 'wf_analytics',        label: 'Analytics Setup (GA4)',                 low: 1000, high:  1750, floor:  500 },
        { id: 'wf_training',         label: 'CMS Training & Documentation',          low: 1000, high:  1500, floor:  500 },
      ],
    },
    shopify: {
      id: 'shopify',
      label: 'Shopify',
      bundleRange: { low: 14000, high: 22000 },
      services: [
        { id: 'sh_theme_build',      label: 'Theme Build & Store Setup',             low: 7500, high: 11000, floor: 3750 },
        { id: 'sh_integrations',     label: 'App & Third-Party Integrations',        low: 2500, high:  4000, floor: 1250 },
        { id: 'sh_liquid',           label: 'Custom Liquid / Metafield Work',        low: 3500, high:  5500, floor: 1750 },
        { id: 'sh_seo',              label: 'SEO Foundation & Metadata',             low: 2000, high:  3000, floor: 1000 },
        { id: 'sh_analytics',        label: 'Analytics Setup (GA4 / Pixel)',         low: 1000, high:  1750, floor:  500 },
        { id: 'sh_training',         label: 'Admin Training & Documentation',        low: 1000, high:  1500, floor:  500 },
      ],
    },
    sanity: {
      id: 'sanity',
      label: 'Sanity',
      bundleRange: { low: 28000, high: 40000 },
      services: [
        { id: 'sa_studio_setup',     label: 'Sanity Studio Setup & Schema Design',   low:  9000, high: 13000, floor: 4500 },
        { id: 'sa_frontend',         label: 'Frontend Build (Next.js / Astro)',       low: 11000, high: 16000, floor: 5500 },
        { id: 'sa_integrations',     label: 'Third-Party Integrations',              low:  3500, high:  5500, floor: 1750 },
        { id: 'sa_custom_tool',      label: 'Custom Tool / App within Site',         low:  7500, high: 11000, floor: 3750 },
        { id: 'sa_seo',              label: 'SEO Foundation & Metadata',             low:  2000, high:  3000, floor: 1000 },
        { id: 'sa_analytics',        label: 'Analytics Setup (GA4)',                 low:  1000, high:  1750, floor:  500 },
        { id: 'sa_training',         label: 'CMS Training & Documentation',          low:  1500, high:  2000, floor:  750 },
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
  bundleRange: { low: 15000, high: 22000 },
  services: [
    { id: 'website_copy',       label: 'Website Copywriting (full site)', low: 4500, high:  6500, floor: 1750 },
    { id: 'brand_messaging',    label: 'Brand Messaging / Taglines',      low: 2500, high:  3500, floor: 1250 },
    { id: 'campaign_copy',      label: 'Campaign Copy',                   low: 2500, high:  4000, floor: 1250 },
    { id: 'content_strategy',   label: 'Content Strategy',                low: 4000, high:  6000, floor: 2000 },
    { id: 'content_pillars',    label: 'Content Pillars & Frameworks',    low: 2500, high:  3500, floor: 1250 },
    { id: 'social_copy',        label: 'Social Copy Package',             low: 1500, high:  2500, floor:  750 },
    { id: 'email_templates',    label: 'Email / Newsletter Templates',    low: 1500, high:  2500, floor:  750 },
  ],
}

// ---------------------------------------------------------------------------
// Category 6 — PR & Communications
// ---------------------------------------------------------------------------

export const PR_COMMS = {
  id: 'pr_comms',
  label: 'PR & Communications',
  bundleRange: { low: 24000, high: 38000 },
  services: [
    { id: 'media_strategy',     label: 'Media Strategy & Planning',          low: 4000, high:  6000, floor: 2000 },
    { id: 'press_release',      label: 'Press Release (writing + distribution)', low: 1500, high: 2500, floor: 750 },
    { id: 'media_kit',          label: 'Media Kit (digital + print)',        low: 2500, high:  4000, floor: 1250 },
    { id: 'media_pitch',        label: 'Media Pitch Writing',                low: 2000, high:  3000, floor: 1000 },
    { id: 'media_list',         label: 'Media List Development',             low: 1500, high:  2500, floor:  750 },
    { id: 'media_outreach',     label: 'Media Outreach & Relations',         low: 4000, high:  6000, floor: 2000 },
    { id: 'exec_profiling',     label: 'Executive Profiling & Bios',         low: 1500, high:  2500, floor:  750 },
    { id: 'crisis_comms',       label: 'Crisis Communications Framework',    low: 4500, high:  6500, floor: 2250 },
    { id: 'awards_submission',  label: 'Awards Submission Strategy',         low: 1500, high:  2500, floor:  750 },
    { id: 'speaking_opps',      label: 'Speaking Opportunity Development',   low: 2500, high:  3500, floor: 1250 },
    { id: 'influencer_relations',label: 'Influencer Relations Strategy',     low: 3500, high:  5000, floor: 1750 },
    { id: 'media_monitoring',   label: 'Media Monitoring Setup',             low: 1500, high:  2500, floor:  750 },
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
    { id: 'landing_page',     label: 'Landing Page Design',           low: 2000, high:  3000, floor:  500, modifier: 'page_count_landing' },
    { id: 'packaging',        label: 'Packaging Design',              low: 3500, high:  5500, floor: 1250, modifier: 'sku_count' },
    { id: 'pitch_deck',       label: 'Presentation / Pitch Deck Design', low: 2500, high: 4000, floor: 1250, modifier: null },
    { id: 'social_templates', label: 'Social Media Creative Templates',  low: 1500, high: 2500, floor:  750, modifier: null },
    { id: 'print_collateral', label: 'Print Collateral',              low: 1500, high:  3000, floor:  750, modifier: null },
    { id: 'digital_ad',       label: 'Digital Ad Creative',           low: 1500, high:  2500, floor:  750, modifier: null },
    { id: 'trade_show',       label: 'Trade Show / Event Materials',  low: 2500, high:  4000, floor: 1250, modifier: null },
  ],
}

// ---------------------------------------------------------------------------
// Category 8 — Email Design & Production (no bundle)
// ---------------------------------------------------------------------------

export const EMAIL_DESIGN = {
  id: 'email_design',
  label: 'Email Design & Production',
  bundleRange: null, // no bundle pricing
  services: [
    { id: 'email_template_design',  label: 'Email Template Design (Figma)',  low: 1000, high: 1500, floor:  500 },
    { id: 'klaviyo_template_build', label: 'Klaviyo Template Build',          low:  750, high: 1250, floor:  400 },
    { id: 'flow_welcome',           label: 'Flow — Welcome Series',           low: 1750, high: 2750, floor:  875 },
    { id: 'flow_post_purchase',     label: 'Flow — Post-Purchase',            low: 1500, high: 2250, floor:  750 },
    { id: 'flow_abandoned_cart',    label: 'Flow — Abandoned Cart',           low: 1250, high: 2000, floor:  625 },
    { id: 'flow_winback',           label: 'Flow — Win-back',                 low: 1250, high: 2000, floor:  625 },
    { id: 'campaign_email',         label: 'Campaign Email (design + build)', low: 1000, high: 1500, floor:  500 },
    { id: 'custom_html_build',      label: 'Custom HTML Build',               low: 2500, high: 4000, floor: 1250 },
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
  EMAIL_DESIGN,
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
