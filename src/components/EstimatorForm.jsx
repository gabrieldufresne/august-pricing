import * as React from 'react'
import { motion, AnimatePresence, useScroll, useMotionValue } from 'framer-motion'
import { ServiceSelector } from './ServiceSelector'
import { ClientContribution } from './ClientContribution'
import { ContractorPanel } from './ContractorPanel'
import { PartnerPanel } from './PartnerPanel'
import { PriceAdjustment } from './PriceAdjustment'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { calculateEstimate, computeBusinessDays, getTimelineTier } from '@/lib/pricingEngine'
import { CLIENT_SCALE_MULTIPLIERS, LOCATION_MULTIPLIERS, BANDWIDTH_MULTIPLIERS } from '@/lib/pricingConfig'
import { cn } from '@/lib/utils'

// Motion-enhanced ToggleGroupItem for whileTap press states
const MotionToggleGroupItem = motion(ToggleGroupItem)

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_FORM = {
  scopeType: 'full',
  projectName: '',
  projectObjective: '',
  notes: '',
  clientContributions: [],
  selectedServices: {
    brand_strategy: [],
    visual_identity: [],
    website_design: [],
    website_dev: [],
    copywriting: [],
    pr_comms: [],
    misc_design: [],
    email_design: [],
  },
  websiteDevPlatform: null,
  websiteDesignPageCount: '11_20',
  websiteDevPageCount: '11_20',
  packagingSkuCount: '1',
  complexity: {
    brand_strategy: 'medium',
    visual_identity: 'medium',
    website_design: 'medium',
    website_dev: 'medium',
    copywriting: 'medium',
    pr_comms: 'medium',
    misc_design: 'medium',
    email_design: 'medium',
  },
  clientScale: 'small',
  clientLocation: 'montreal',
  startDate: '',
  endDate: '',
  contractors: {},
  bandwidth: 'open',
  discountFriendsFamily: false,
  discountReturningClient: false,
  customDiscountValue: '',
  customDiscountType: '%',
  customDiscountReason: '',
  partnerArrangement: {
    referral: { active: false, referrerName: '', mode: '%', value: '' },
    coAgency: { active: false, partnerName: '', approxFee: '' },
  },
}

// ---------------------------------------------------------------------------
// Section wrapper — sticky card with entrance animation + scroll-driven transform
// ---------------------------------------------------------------------------

function Section({ title, children, delay = 0, stickyTop = 80, stackIndex = 0 }) {
  const containerRef = React.useRef(null)
  const stickyPointRef = React.useRef(99999)
  const { scrollY } = useScroll()
  const scaleValue = useMotionValue(1)
  const shadowValue = useMotionValue('0 1px 3px rgba(0,0,0,0.04)')

  React.useLayoutEffect(() => {
    if (containerRef.current) {
      stickyPointRef.current = containerRef.current.offsetTop - stickyTop
    }
  }, [stickyTop])

  React.useEffect(() => {
    return scrollY.on('change', (y) => {
      const sp = stickyPointRef.current
      const p = Math.min(Math.max((y - sp) / 400, 0), 1)
      scaleValue.set(1 - p * 0.03)
      shadowValue.set(`0 ${1 + p * 7}px ${3 + p * 21}px rgba(0,0,0,${(0.04 + p * 0.06).toFixed(3)})`)
    })
  }, [scrollY])

  return (
    <div ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay }}
        style={{
          position: 'sticky',
          top: stickyTop,
          zIndex: 10 + stackIndex,
          scale: scaleValue,
          boxShadow: shadowValue,
        }}
      >
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/30">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {title}
            </h3>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ScopeTypeSelector — Full Engagement vs Campaign / Project
// ---------------------------------------------------------------------------

function ScopeTypeSelector({ value, onChange }) {
  const isCampaign = value === 'campaign'
  return (
    <div className="space-y-3">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => { if (v) onChange('scopeType', v) }}
        className="justify-start gap-2"
      >
        {[
          { id: 'full',     label: 'Full Engagement' },
          { id: 'campaign', label: 'Campaign / Project' },
        ].map(({ id, label }) => (
          <MotionToggleGroupItem
            key={id}
            value={id}
            size="sm"
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'h-8 px-4 text-xs rounded-md border border-border font-medium',
              'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground',
              'data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground'
            )}
          >
            {label}
          </MotionToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {isCampaign
          ? 'Bundle pricing disabled. Services priced as standalone deliverables — discovery overhead not shared.'
          : 'Bundle pricing applies. Discovery overhead amortized across the full project scope.'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TimelineSection — start/end dates + computed label
// ---------------------------------------------------------------------------

function TimelineSection({ formData, onChange }) {
  const businessDays = computeBusinessDays(formData.startDate, formData.endDate)
  const tier = getTimelineTier(businessDays)

  const tierColors = {
    standard:   'text-muted-foreground',
    compressed: 'text-amber-600',
    rush:       'text-red-600',
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start date</Label>
          <Input
            id="start-date"
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end-date" className="text-xs text-muted-foreground">End date</Label>
          <Input
            id="end-date"
            type="date"
            value={formData.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {businessDays !== null && businessDays > 0 && (
        <p className={cn('text-xs font-medium', tierColors[tier?.id] ?? 'text-muted-foreground')}>
          {businessDays} business days · {tier?.label ?? '—'}
          {tier?.id === 'rush' && ' (+30%)'}
          {tier?.id === 'compressed' && ' (+15%)'}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EstimatorForm
// ---------------------------------------------------------------------------

export function EstimatorForm({ onResultChange, onResetRef, config = null }) {
  const [formData, setFormData] = React.useState(DEFAULT_FORM)

  function handleChange(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleReset() {
    setFormData(DEFAULT_FORM)
  }

  // Expose reset to parent via ref callback
  React.useEffect(() => {
    if (onResetRef) onResetRef.current = handleReset
  })

  React.useEffect(() => {
    const result = calculateEstimate(formData, config)
    if (result) {
      onResultChange({
        ...result,
        projectName: formData.projectName,
        projectObjective: formData.projectObjective,
        notes: formData.notes,
      })
    } else {
      onResultChange(null)
    }
  }, [formData, config])

  return (
    <div className="space-y-4">

      {/* 0 — Scope Type */}
      <Section title="Scope Type" delay={0} stickyTop={56} stackIndex={0}>
        <ScopeTypeSelector value={formData.scopeType} onChange={handleChange} />
      </Section>

      {/* A — Project Basics (includes client profile) */}
      <Section title="Project Basics" delay={0.05} stickyTop={100} stackIndex={1}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-xs text-muted-foreground">
              Client / Project name
            </Label>
            <Input
              id="project-name"
              placeholder="e.g. Maison Leduc — Brand Refresh"
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-objective" className="text-xs text-muted-foreground">
              Primary objective
            </Label>
            <Input
              id="project-objective"
              placeholder="e.g. Launch new product line with full brand identity"
              value={formData.projectObjective}
              onChange={(e) => handleChange('projectObjective', e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client scale</Label>
              <Select
                value={formData.clientScale}
                onValueChange={(v) => handleChange('clientScale', v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_SCALE_MULTIPLIERS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Select
                value={formData.clientLocation}
                onValueChange={(v) => handleChange('clientLocation', v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_MULTIPLIERS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Section>

      {/* B — Services */}
      <Section title="Services" delay={0.1} stickyTop={144} stackIndex={2}>
        <ServiceSelector formData={formData} onChange={handleChange} />
      </Section>

      {/* C — Client Contributions */}
      <Section title="Client Contributions" delay={0.15} stickyTop={188} stackIndex={3}>
        <ClientContribution formData={formData} onChange={handleChange} />
      </Section>

      {/* E — Timeline */}
      <Section title="Timeline" delay={0.2} stickyTop={232} stackIndex={4}>
        <TimelineSection formData={formData} onChange={handleChange} />
      </Section>

      {/* F — Resource Considerations */}
      <Section title="Resource Considerations" delay={0.25} stickyTop={276} stackIndex={5}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              External support
            </p>
            <ContractorPanel formData={formData} onChange={handleChange} />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Internal bandwidth
            </p>
            <ToggleGroup
              type="single"
              value={formData.bandwidth}
              onValueChange={(v) => { if (v) handleChange('bandwidth', v) }}
              className="justify-start gap-2"
            >
              {BANDWIDTH_MULTIPLIERS.map((opt) => {
                const isOn = formData.bandwidth === opt.id
                const pctLabel = opt.id !== 'open' && opt.multiplier !== 1
                  ? `+${Math.round((opt.multiplier - 1) * 100)}%`
                  : null
                return (
                  <MotionToggleGroupItem
                    key={opt.id}
                    value={opt.id}
                    size="sm"
                    layout
                    whileTap={{ scale: 0.96 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                      type: 'spring', stiffness: 400, damping: 25,
                    }}
                    className={cn(
                      'h-8 px-3 text-xs rounded-md border border-border font-medium',
                      'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground',
                      'data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground'
                    )}
                  >
                    <motion.span layout="position">{opt.label}</motion.span>
                    <AnimatePresence>
                      {isOn && pctLabel && (
                        <motion.span
                          initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                          animate={{ opacity: 1, width: 'auto', marginLeft: 4 }}
                          exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden whitespace-nowrap inline-block"
                        >
                          {pctLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </MotionToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>
        </div>
      </Section>

      {/* G — Partner Arrangement */}
      <Section title="Partner Arrangement" delay={0.3} stickyTop={320} stackIndex={6}>
        <PartnerPanel formData={formData} onChange={handleChange} />
      </Section>

      {/* H — Discounts */}
      <Section title="Discounts" delay={0.35} stickyTop={364} stackIndex={7}>
        <PriceAdjustment formData={formData} onChange={handleChange} />
      </Section>

    </div>
  )
}
