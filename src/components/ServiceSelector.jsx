import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'

import {
  CATEGORIES,
  WEBSITE_DEV,
  PAGE_COUNT_TIERS_DESIGN,
  PAGE_COUNT_TIERS_DEV,
  PAGE_COUNT_TIERS_LANDING,
  SKU_COUNT_TIERS,
} from '@/lib/pricingConfig'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtRange(low, high) {
  return `${fmt(low)} – ${fmt(high)}`
}

// ---------------------------------------------------------------------------
// ComplexitySelector — Low / Med / High toggle, shown when services selected
// ---------------------------------------------------------------------------

function ComplexitySelector({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between pt-3 mt-3 border-t border-border"
    >
      <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
        Complexity
      </span>
      <ToggleGroup
        type="single"
        value={value ?? 'medium'}
        onValueChange={(v) => { if (v) onChange(v) }}
        className="gap-1"
      >
        {[
          { id: 'low',    label: 'Low' },
          { id: 'medium', label: 'Med' },
          { id: 'high',   label: 'High' },
        ].map(({ id, label }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            size="sm"
            className={cn(
              'h-7 px-3 text-xs rounded-md border border-border font-medium',
              'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground',
              'data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground',
              id === 'high' && 'data-[state=on]:bg-amber-600 data-[state=on]:border-amber-600 data-[state=on]:text-white'
            )}
          >
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// TierSelector — generic radio group for page count / SKU count
// ---------------------------------------------------------------------------

function TierSelector({ label, tiers, value, onChange }) {
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-2">
        {label}
      </p>
      <RadioGroup
        value={value ?? tiers[0].id}
        onValueChange={onChange}
        className="flex flex-wrap gap-2"
      >
        {tiers.map((tier) => (
          <div key={tier.id} className="flex items-center">
            <RadioGroupItem value={tier.id} id={`tier-${tier.id}`} className="sr-only" />
            <Label
              htmlFor={`tier-${tier.id}`}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center h-7 px-3 text-xs rounded-md border font-medium transition-colors select-none',
                value === tier.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'
              )}
            >
              {tier.label}
              {tier.flag && <span className="ml-1 text-amber-600">↗</span>}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlatformSelector — Webflow / Shopify / Sanity radio
// ---------------------------------------------------------------------------

function PlatformSelector({ value, onChange }) {
  const platforms = Object.values(WEBSITE_DEV.platforms)
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          Platform
        </p>
        {!value && (
          <p className="text-xs text-muted-foreground">— select to see services</p>
        )}
      </div>
      <RadioGroup
        value={value ?? ''}
        onValueChange={onChange}
        className="flex gap-2"
      >
        {platforms.map((p) => (
          <div key={p.id} className="flex items-center">
            <RadioGroupItem value={p.id} id={`platform-${p.id}`} className="sr-only" />
            <Label
              htmlFor={`platform-${p.id}`}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center h-8 px-4 text-sm rounded-md border font-medium transition-colors select-none',
                value === p.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'
              )}
            >
              {p.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ServiceRow — single checkbox + label + range
// ---------------------------------------------------------------------------

function ServiceRow({ service, checked, onToggle }) {
  return (
    <div
      className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer group"
      onClick={() => onToggle(service.id)}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id={`svc-${service.id}`}
          checked={checked}
          onCheckedChange={() => onToggle(service.id)}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
        <Label
          htmlFor={`svc-${service.id}`}
          className="cursor-pointer text-sm font-normal leading-tight select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {service.label}
        </Label>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-4 tabular-nums">
        {fmtRange(service.low, service.high)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CategoryAccordionItem — one full accordion panel
// ---------------------------------------------------------------------------

function CategoryAccordionItem({ category, formData, onChange }) {
  const catId = category.id
  const isWebsiteDev = catId === 'website_dev'
  const isMiscDesign = catId === 'misc_design'

  // Resolve active service list
  const activeServices = React.useMemo(() => {
    if (isWebsiteDev) {
      const platform = formData.websiteDevPlatform
      if (!platform || !WEBSITE_DEV.platforms[platform]) return []
      return WEBSITE_DEV.platforms[platform].services
    }
    return category.services
  }, [isWebsiteDev, catId, formData.websiteDevPlatform])

  const selectedIds = formData.selectedServices?.[catId] ?? []
  const selectedCount = selectedIds.length
  const totalCount = activeServices.length
  const allSelected = totalCount > 0 && selectedCount === totalCount
  const isCampaign = formData.scopeType === 'campaign'
  const hasBundle = isWebsiteDev
    ? !!WEBSITE_DEV.platforms[formData.websiteDevPlatform]?.bundleRange
    : !!category.bundleRange

  // Bundle range display
  const bundleRange = React.useMemo(() => {
    if (isWebsiteDev) {
      const plat = WEBSITE_DEV.platforms[formData.websiteDevPlatform]
      return plat?.bundleRange ?? null
    }
    return category.bundleRange ?? null
  }, [isWebsiteDev, formData.websiteDevPlatform, category.bundleRange])

  // Toggle Select All
  function handleSelectAll(checked) {
    if (checked) {
      onChange('selectedServices', {
        ...formData.selectedServices,
        [catId]: activeServices.map((s) => s.id),
      })
    } else {
      onChange('selectedServices', {
        ...formData.selectedServices,
        [catId]: [],
      })
    }
  }

  // Toggle individual service
  function handleServiceToggle(serviceId) {
    const current = formData.selectedServices?.[catId] ?? []
    const next = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId]
    onChange('selectedServices', { ...formData.selectedServices, [catId]: next })
  }

  // Platform change — clears selection + resets page count
  function handlePlatformChange(platformId) {
    onChange('websiteDevPlatform', platformId)
    onChange('selectedServices', { ...formData.selectedServices, [catId]: [] })
    onChange('websiteDevPageCount', '11_20')
  }

  const complexity = formData.complexity?.[catId] ?? 'medium'
  function handleComplexityChange(val) {
    onChange('complexity', { ...formData.complexity, [catId]: val })
  }

  const showLandingPageCount = isMiscDesign && selectedIds.includes('landing_page')
  const showSkuCount = isMiscDesign && selectedIds.includes('packaging')
  const showPageCountDesign = catId === 'website_design' && selectedCount > 0
  const showPageCountDev = isWebsiteDev && selectedCount > 0

  return (
    <AccordionPrimitive.Item value={catId} className="border-b border-border last:border-0">
      {/* Custom header with Switch outside the trigger button */}
      <AccordionPrimitive.Header className="flex items-center">
        <AccordionPrimitive.Trigger
          className={cn(
            'flex flex-1 items-center gap-3 pl-4 py-4 text-left transition-all',
            '[&[data-state=open]>.chevron]:rotate-180'
          )}
        >
          <ChevronDown className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          <span className="flex-1 font-medium text-sm">{category.label}</span>

          {/* Selected count badge */}
          <AnimatePresence>
            {selectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
              >
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {!isCampaign && allSelected && hasBundle ? 'Bundle' : `${selectedCount}/${totalCount}`}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </AccordionPrimitive.Trigger>

        {/* Select All switch — outside trigger to prevent accordion toggle conflict */}
        <div
          className="flex items-center gap-2 pr-1 pl-3 py-4"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-muted-foreground select-none">All</span>
          <Switch
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={isWebsiteDev && !formData.websiteDevPlatform}
            className="scale-90"
          />
        </div>
      </AccordionPrimitive.Header>

      <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="pb-4 px-4">

          {/* Bundle callout — hidden in Campaign / Project mode */}
          {!isCampaign && hasBundle && bundleRange && (
            <div className="mb-3 px-3 py-2 rounded-md bg-secondary/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Bundle (select all)
              </span>
              <span className="text-xs font-medium tabular-nums">
                {fmtRange(bundleRange.low, bundleRange.high)}
              </span>
            </div>
          )}

          {/* Platform selector for Website Dev */}
          {isWebsiteDev && (
            <PlatformSelector
              value={formData.websiteDevPlatform}
              onChange={handlePlatformChange}
            />
          )}

          {/* Service list */}
          {activeServices.length > 0 && (
            <div className="space-y-0.5">
              {activeServices.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  checked={selectedIds.includes(service.id)}
                  onToggle={handleServiceToggle}
                />
              ))}
            </div>
          )}

          {/* Per-service scope modifiers for Misc Design */}
          <AnimatePresence>
            {showLandingPageCount && (
              <motion.div
                key="landing-page-count"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TierSelector
                  label="Landing page count"
                  tiers={PAGE_COUNT_TIERS_LANDING}
                  value={formData.landingPageCount}
                  onChange={(v) => onChange('landingPageCount', v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSkuCount && (
              <motion.div
                key="sku-count"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TierSelector
                  label="SKU count"
                  tiers={SKU_COUNT_TIERS}
                  value={formData.packagingSkuCount}
                  onChange={(v) => onChange('packagingSkuCount', v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page count selectors */}
          <AnimatePresence>
            {showPageCountDesign && (
              <motion.div
                key="page-count-design"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TierSelector
                  label="Page count"
                  tiers={PAGE_COUNT_TIERS_DESIGN}
                  value={formData.websiteDesignPageCount}
                  onChange={(v) => onChange('websiteDesignPageCount', v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPageCountDev && (
              <motion.div
                key="page-count-dev"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TierSelector
                  label="Page count"
                  tiers={PAGE_COUNT_TIERS_DEV}
                  value={formData.websiteDevPageCount}
                  onChange={(v) => onChange('websiteDevPageCount', v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complexity — shown whenever any service is selected */}
          <AnimatePresence>
            {selectedCount > 0 && (
              <ComplexitySelector
                value={complexity}
                onChange={handleComplexityChange}
              />
            )}
          </AnimatePresence>

        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

// ---------------------------------------------------------------------------
// ServiceSelector — exported root component
// ---------------------------------------------------------------------------

export function ServiceSelector({ formData, onChange }) {
  return (
    <AccordionPrimitive.Root
      type="multiple"
      className="rounded-lg border border-border overflow-hidden"
    >
      {CATEGORIES.map((category) => (
        <CategoryAccordionItem
          key={category.id}
          category={category}
          formData={formData}
          onChange={onChange}
        />
      ))}
    </AccordionPrimitive.Root>
  )
}
