import * as React from 'react'
import { ServiceSelector } from './ServiceSelector'
import { ClientContribution } from './ClientContribution'
import { ContractorPanel } from './ContractorPanel'
import { PriceAdjustment } from './PriceAdjustment'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { calculateEstimate, computeBusinessDays, getTimelineTier } from '@/lib/pricingEngine'
import { CLIENT_SCALE_MULTIPLIERS, LOCATION_MULTIPLIERS, BANDWIDTH_MULTIPLIERS } from '@/lib/pricingConfig'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_FORM = {
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
  },
  websiteDevPlatform: null,
  websiteDesignPageCount: '11_20',
  websiteDevPageCount: '11_20',
  landingPageCount: '1',
  packagingSkuCount: '1',
  complexity: {
    brand_strategy: 'medium',
    visual_identity: 'medium',
    website_design: 'medium',
    website_dev: 'medium',
    copywriting: 'medium',
    pr_comms: 'medium',
    misc_design: 'medium',
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
}

// ---------------------------------------------------------------------------
// Section wrapper — consistent card style
// ---------------------------------------------------------------------------

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-secondary/30">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
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

      {/* A — Project Basics */}
      <Section title="Project Basics">
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
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-muted-foreground">
              Notes <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Anything worth capturing before scoping..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="text-sm resize-none min-h-[72px]"
            />
          </div>
        </div>
      </Section>

      {/* B — Client Contribution */}
      <Section title="Client Contributions">
        <ClientContribution formData={formData} onChange={handleChange} />
      </Section>

      {/* C — Services */}
      <Section title="Services">
        <ServiceSelector formData={formData} onChange={handleChange} />
      </Section>

      {/* D — Client Profile */}
      <Section title="Client Profile">
        <div className="space-y-3">
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

      {/* E — Timeline */}
      <Section title="Timeline">
        <TimelineSection formData={formData} onChange={handleChange} />
      </Section>

      {/* F — Resource Considerations */}
      <Section title="Resource Considerations">
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
              {BANDWIDTH_MULTIPLIERS.map((opt) => (
                <ToggleGroupItem
                  key={opt.id}
                  value={opt.id}
                  size="sm"
                  className={cn(
                    'h-8 px-3 text-xs rounded-md border border-border font-medium',
                    'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground',
                    'data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground'
                  )}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {BANDWIDTH_MULTIPLIERS.find((o) => o.id === formData.bandwidth)?.description}
            </p>
          </div>
        </div>
      </Section>

      {/* G — Discounts */}
      <Section title="Discounts">
        <PriceAdjustment formData={formData} onChange={handleChange} />
      </Section>

    </div>
  )
}
