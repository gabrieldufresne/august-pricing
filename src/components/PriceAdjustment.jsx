import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const PRESET_DISCOUNTS = [
  { id: 'discountFriendsFamily',    label: 'Friends & family',  pct: 15 },
  { id: 'discountReturningClient',  label: 'Returning client',  pct: 10 },
]

export function PriceAdjustment({ formData, onChange }) {
  const customValue  = formData.customDiscountValue  ?? ''
  const customType   = formData.customDiscountType   ?? '%'
  const customReason = formData.customDiscountReason ?? ''

  const customNum = parseFloat(customValue) || 0
  const isLarge = customType === '%' && customNum > 30

  function handleTypeToggle() {
    onChange('customDiscountType', customType === '%' ? '$' : '%')
  }

  return (
    <div className="space-y-1">
      {/* Preset checkbox discounts */}
      {PRESET_DISCOUNTS.map(({ id, label, pct }) => {
        const checked = !!formData[id]
        return (
          <div
            key={id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={() => onChange(id, !checked)}
          >
            <Checkbox
              id={`discount-${id}`}
              checked={checked}
              onCheckedChange={(v) => onChange(id, v)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />
            <Label
              htmlFor={`discount-${id}`}
              className="flex-1 text-sm font-normal cursor-pointer select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">−{pct}%</span>
          </div>
        )
      })}

      {/* Custom discount row */}
      <div className="px-3 py-2.5 space-y-2">
        <Label className="text-xs text-muted-foreground">Custom</Label>
        <div className="flex items-center gap-2">
          {/* Narrow value input — no spinners */}
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={customValue}
            onChange={(e) => onChange('customDiscountValue', e.target.value)}
            className={cn(
              'h-8 text-sm text-center tabular-nums shrink-0 w-16',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              isLarge && 'border-amber-400 focus-visible:ring-amber-400'
            )}
          />

          {/* % / $ toggle button */}
          <button
            type="button"
            onClick={handleTypeToggle}
            className="h-8 w-8 shrink-0 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {customType}
          </button>

          {/* Reason */}
          <Input
            placeholder="Reason (optional)"
            value={customReason}
            onChange={(e) => onChange('customDiscountReason', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <AnimatePresence>
          {isLarge && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
            >
              Discount exceeds 30% — double-check before sharing.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
