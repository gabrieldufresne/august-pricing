// =============================================================================
// ConfigEditor.jsx — August Estimator
// Full-screen overlay for editing pricing config values.
// =============================================================================

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CATEGORIES,
  CLIENT_SCALE_MULTIPLIERS,
  LOCATION_MULTIPLIERS,
  TIMELINE_MULTIPLIERS,
  BANDWIDTH_MULTIPLIERS,
  CLIENT_CONTRIBUTIONS,
} from '@/lib/pricingConfig'

// ---------------------------------------------------------------------------
// NumberInput — uncontrolled, commits on blur
// ---------------------------------------------------------------------------

function NumberInput({ defaultValue, onCommit, step = '1', min = '0', className = '' }) {
  const [warn, setWarn] = React.useState(false)

  function handleBlur(e) {
    const raw = e.target.value.trim()
    const num = step === '1' ? parseInt(raw, 10) : parseFloat(raw)
    if (isNaN(num) || num < 0) {
      setWarn(true)
      return
    }
    setWarn(false)
    onCommit(num)
  }

  return (
    <div className="relative">
      <input
        type="number"
        defaultValue={defaultValue}
        step={step}
        min={min}
        onBlur={handleBlur}
        className={`w-full rounded-md border px-2 py-1 text-sm text-right tabular-nums bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${
          warn ? 'border-amber-400' : 'border-border'
        } ${className}`}
      />
      {warn && (
        <p className="absolute right-0 top-full mt-0.5 text-[10px] text-amber-500 whitespace-nowrap">
          Invalid value
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column header row for service tables
// ---------------------------------------------------------------------------

function ServiceTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_90px_90px_90px] gap-2 mb-1 px-1">
      <span />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Low</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right">High</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Floor</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single service row
// ---------------------------------------------------------------------------

function ServiceRow({ service, configPrice, onUpdate }) {
  const prices = configPrice ?? { low: service.low, high: service.high, floor: service.floor }

  // Inline floor/range validation hint
  const hasFloorWarning = prices.floor > prices.low
  const hasRangeWarning = prices.low > prices.high

  return (
    <div className="grid grid-cols-[1fr_90px_90px_90px] gap-2 items-center py-1.5 px-1 rounded hover:bg-muted/30 transition-colors">
      <div>
        <span className="text-sm text-foreground">{service.label}</span>
        {(hasFloorWarning || hasRangeWarning) && (
          <span className="ml-2 text-[10px] text-amber-500">
            {hasFloorWarning ? 'floor > low' : 'low > high'}
          </span>
        )}
      </div>
      <NumberInput
        defaultValue={prices.low}
        onCommit={(v) => onUpdate(service.id, 'low', v)}
      />
      <NumberInput
        defaultValue={prices.high}
        onCommit={(v) => onUpdate(service.id, 'high', v)}
      />
      <NumberInput
        defaultValue={prices.floor}
        onCommit={(v) => onUpdate(service.id, 'floor', v)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bundle range row
// ---------------------------------------------------------------------------

function BundleRow({ bundleKey, bundleRange, onUpdate }) {
  if (!bundleRange) return null
  return (
    <div className="grid grid-cols-[1fr_90px_90px_90px] gap-2 items-center py-2 px-1 mb-1 rounded bg-muted/40">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Bundle
      </span>
      <NumberInput
        defaultValue={bundleRange.low}
        onCommit={(v) => onUpdate(bundleKey, 'low', v)}
      />
      <NumberInput
        defaultValue={bundleRange.high}
        onCommit={(v) => onUpdate(bundleKey, 'high', v)}
      />
      <div /> {/* no floor for bundles */}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Services tab
// ---------------------------------------------------------------------------

function ServicesTab({ config, onConfigChange }) {
  function updateServicePrice(serviceId, field, value) {
    onConfigChange({
      ...config,
      servicePrices: {
        ...config.servicePrices,
        [serviceId]: { ...config.servicePrices[serviceId], [field]: value },
      },
    })
  }

  function updateBundleRange(key, field, value) {
    onConfigChange({
      ...config,
      bundleRanges: {
        ...config.bundleRanges,
        [key]: { ...config.bundleRanges[key], [field]: value },
      },
    })
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-4">
        All values in CAD. Changes apply immediately to the live estimate.
      </p>
      <Accordion type="multiple" className="w-full">
        {CATEGORIES.map((cat) => {
          if (cat.id === 'website_dev') {
            // Render one accordion item per platform
            return Object.values(cat.platforms).map((platform) => {
              const bundleKey = `website_dev_${platform.id}`
              return (
                <AccordionItem key={bundleKey} value={bundleKey}>
                  <AccordionTrigger className="text-sm font-medium">
                    Website Dev — {platform.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ServiceTableHeader />
                    <BundleRow
                      bundleKey={bundleKey}
                      bundleRange={config.bundleRanges[bundleKey]}
                      onUpdate={updateBundleRange}
                    />
                    {platform.services.map((svc) => (
                      <ServiceRow
                        key={svc.id}
                        service={svc}
                        configPrice={config.servicePrices[svc.id]}
                        onUpdate={updateServicePrice}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )
            })
          }

          return (
            <AccordionItem key={cat.id} value={cat.id}>
              <AccordionTrigger className="text-sm font-medium">
                {cat.label}
              </AccordionTrigger>
              <AccordionContent>
                <ServiceTableHeader />
                {cat.bundleRange && (
                  <BundleRow
                    bundleKey={cat.id}
                    bundleRange={config.bundleRanges[cat.id]}
                    onUpdate={updateBundleRange}
                  />
                )}
                {(cat.services ?? []).map((svc) => (
                  <ServiceRow
                    key={svc.id}
                    service={svc}
                    configPrice={config.servicePrices[svc.id]}
                    onUpdate={updateServicePrice}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Multipliers tab
// ---------------------------------------------------------------------------

const MULTIPLIER_GROUPS = [
  {
    key: 'complexityMultipliers',
    label: 'Complexity',
    type: 'object',
    rows: [
      { id: 'low', label: 'Low' },
      { id: 'medium', label: 'Medium' },
      { id: 'high', label: 'High' },
    ],
  },
  {
    key: 'clientScaleMultipliers',
    label: 'Client Scale',
    type: 'array',
    source: CLIENT_SCALE_MULTIPLIERS,
  },
  {
    key: 'locationMultipliers',
    label: 'Location',
    type: 'array',
    source: LOCATION_MULTIPLIERS,
  },
  {
    key: 'timelineMultipliers',
    label: 'Timeline',
    type: 'array',
    source: TIMELINE_MULTIPLIERS,
  },
  {
    key: 'bandwidthMultipliers',
    label: 'Bandwidth',
    type: 'array',
    source: BANDWIDTH_MULTIPLIERS,
  },
]

function MultipliersTab({ config, onConfigChange }) {
  function updateObjectMultiplier(configKey, id, value) {
    onConfigChange({
      ...config,
      [configKey]: { ...config[configKey], [id]: value },
    })
  }

  function updateArrayMultiplier(configKey, id, value) {
    onConfigChange({
      ...config,
      [configKey]: config[configKey].map((item) =>
        item.id === id ? { ...item, multiplier: value } : item
      ),
    })
  }

  function updateCampaignScalar(value) {
    onConfigChange({ ...config, campaignScalar: value })
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground">
        Multipliers are applied in order: scale × location × timeline × bandwidth × complexity.
        Values below 1.0 reduce the price; above 1.0 increase it.
      </p>
      {MULTIPLIER_GROUPS.map((group) => {
        const rows =
          group.type === 'object'
            ? group.rows
            : group.source.map(({ id, label }) => ({ id, label }))

        return (
          <div key={group.key}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {group.label}
            </p>
            <div className="space-y-1">
              {rows.map(({ id, label }) => {
                const currentValue =
                  group.type === 'object'
                    ? config[group.key][id]
                    : (config[group.key].find((item) => item.id === id)?.multiplier ?? 1.0)

                return (
                  <div
                    key={id}
                    className="grid grid-cols-[1fr_120px] gap-4 items-center py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm text-foreground">{label}</span>
                    <NumberInput
                      defaultValue={currentValue}
                      step="0.01"
                      min="0"
                      onCommit={(v) =>
                        group.type === 'object'
                          ? updateObjectMultiplier(group.key, id, v)
                          : updateArrayMultiplier(group.key, id, v)
                      }
                    />
                  </div>
                )
              })}
            </div>
            <Separator className="mt-6" />
          </div>
        )
      })}

      {/* Campaign / Project mode scalar */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Campaign / Project Mode
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Applied to all service ranges when scope type is set to Campaign / Project.
          Does not affect Full Engagement pricing or bundle ranges.
        </p>
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_120px] gap-4 items-center py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
            <span className="text-sm text-foreground">Standalone delivery scalar</span>
            <NumberInput
              defaultValue={config.campaignScalar ?? 1.12}
              step="0.01"
              min="0"
              onCommit={updateCampaignScalar}
            />
          </div>
        </div>
        <Separator className="mt-6" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contributions tab
// ---------------------------------------------------------------------------

// Map catId to a readable label for display
const CAT_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
)

function ContributionsTab({ config, onConfigChange }) {
  function updateDiscount(contribId, catId, value) {
    // Value comes in as a percentage (e.g. 25), store as decimal (0.25)
    const decimal = Math.min(1, Math.max(0, value / 100))
    onConfigChange({
      ...config,
      clientContributionDiscounts: {
        ...config.clientContributionDiscounts,
        [contribId]: {
          ...config.clientContributionDiscounts[contribId],
          [catId]: decimal,
        },
      },
    })
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground">
        Discount percentages applied to the base price before multipliers.
        Enter values as percentages (e.g. 25 for 25%).
      </p>
      {CLIENT_CONTRIBUTIONS.map((contrib) => {
        const discountMap = config.clientContributionDiscounts[contrib.id] ?? {}
        return (
          <div key={contrib.id}>
            <p className="text-sm font-medium text-foreground mb-1">{contrib.label}</p>
            <p className="text-xs text-muted-foreground mb-3">{contrib.description}</p>
            <div className="space-y-1">
              {contrib.discounts.map((d) => {
                const currentPct = ((discountMap[d.categoryId] ?? d.pct) * 100)
                return (
                  <div
                    key={`${contrib.id}-${d.categoryId}`}
                    className="grid grid-cols-[1fr_120px_20px] gap-3 items-center py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {CAT_LABELS[d.categoryId] ?? d.categoryId}
                      {d.serviceId && (
                        <span className="ml-1 text-xs text-muted-foreground/60">
                          ({d.serviceId})
                        </span>
                      )}
                    </span>
                    <NumberInput
                      defaultValue={parseFloat(currentPct.toFixed(1))}
                      step="0.1"
                      min="0"
                      onCommit={(v) => updateDiscount(contrib.id, d.categoryId, v)}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                )
              })}
            </div>
            <Separator className="mt-6" />
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ConfigEditor — main export
// ---------------------------------------------------------------------------

export function ConfigEditor({ open, onClose, config, onConfigChange, onReset }) {
  // Incrementing this key forces all tab content to re-mount on reset,
  // picking up fresh defaultValues from the new DEFAULT_CONFIG.
  const [resetKey, setResetKey] = React.useState(0)

  function handleReset() {
    onReset()
    setResetKey((k) => k + 1)
  }

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-widest uppercase">
                Config Editor
              </span>
              <span className="text-xs text-muted-foreground">
                Changes save automatically
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset to defaults
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="services" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="shrink-0 mx-6 mt-4 w-fit">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="multipliers">Multipliers</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
            </TabsList>

            {/* Scrollable content — key forces re-mount on reset */}
            <div key={resetKey} className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl px-6 py-6">
                <TabsContent value="services">
                  <ServicesTab config={config} onConfigChange={onConfigChange} />
                </TabsContent>
                <TabsContent value="multipliers">
                  <MultipliersTab config={config} onConfigChange={onConfigChange} />
                </TabsContent>
                <TabsContent value="contributions">
                  <ContributionsTab config={config} onConfigChange={onConfigChange} />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
