import * as React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export function PartnerPanel({ formData, onChange }) {
  const arrangement = formData.partnerArrangement ?? {}
  const referral = arrangement.referral ?? { active: false, referrerName: '', mode: '%', value: '' }
  const coAgency = arrangement.coAgency ?? { active: false, partnerName: '', approxFee: '' }

  function patchReferral(patch) {
    onChange('partnerArrangement', { ...arrangement, referral: { ...referral, ...patch } })
  }

  function patchCoAgency(patch) {
    onChange('partnerArrangement', { ...arrangement, coAgency: { ...coAgency, ...patch } })
  }

  return (
    <div className="space-y-0.5">

      {/* Referral Fee */}
      <div className="rounded-lg overflow-hidden">
        <div
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
          onClick={() => patchReferral({ active: !referral.active })}
        >
          <Checkbox
            id="partner-referral"
            checked={referral.active}
            onCheckedChange={(v) => patchReferral({ active: !!v })}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
          <Label
            htmlFor="partner-referral"
            className="flex-1 text-sm font-normal cursor-pointer select-none"
            onClick={(e) => e.stopPropagation()}
          >
            Referral Fee
            <span className="ml-2 text-xs text-muted-foreground">internal only</span>
          </Label>
        </div>

        {referral.active && (
          <div className="px-3 pb-3 space-y-2">
            <Input
              type="text"
              placeholder="Referrer name"
              value={referral.referrerName}
              onChange={(e) => patchReferral({ referrerName: e.target.value })}
              className="h-8 text-sm"
            />
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={referral.mode}
                onValueChange={(v) => { if (v) patchReferral({ mode: v }) }}
                className="gap-1"
              >
                {['%', '$'].map((m) => (
                  <ToggleGroupItem
                    key={m}
                    value={m}
                    size="sm"
                    className={cn(
                      'h-8 w-8 text-xs rounded-md border border-border font-medium',
                      'data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:border-foreground',
                      'data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground'
                    )}
                  >
                    {m}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={referral.mode === '%' ? 'e.g. 10' : 'Amount'}
                value={referral.value}
                onChange={(e) => patchReferral({ value: e.target.value })}
                className="h-8 text-sm w-28 shrink-0"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Internal only — excluded from client-facing output
            </p>
          </div>
        )}
      </div>

      {/* Co-Agency */}
      <div className="rounded-lg overflow-hidden">
        <div
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
          onClick={() => patchCoAgency({ active: !coAgency.active })}
        >
          <Checkbox
            id="partner-coagency"
            checked={coAgency.active}
            onCheckedChange={(v) => patchCoAgency({ active: !!v })}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
          <Label
            htmlFor="partner-coagency"
            className="flex-1 text-sm font-normal cursor-pointer select-none"
            onClick={(e) => e.stopPropagation()}
          >
            Co-Agency
            <span className="ml-2 text-xs text-muted-foreground">awareness only</span>
          </Label>
        </div>

        {coAgency.active && (
          <div className="px-3 pb-3 space-y-2">
            <Input
              type="text"
              placeholder="Agency partner name"
              value={coAgency.partnerName}
              onChange={(e) => patchCoAgency({ partnerName: e.target.value })}
              className="h-8 text-sm"
            />
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Approx. fee (optional)"
              value={coAgency.approxFee}
              onChange={(e) => patchCoAgency({ approxFee: e.target.value })}
              className="h-8 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Partner invoices client directly — not included in your total
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
