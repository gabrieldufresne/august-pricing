import * as React from 'react'
import { X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CONTRACTORS, CONTRACTOR_MARKUP_RATE } from '@/lib/pricingConfig'

function fmt(n) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n)
}

// contractor entry shape: { cost: '', markup: '10', committed: false }

export function ContractorPanel({ formData, onChange }) {
  const contractors = formData.contractors ?? {}

  const suppressedIds = formData.clientContributions?.includes('client_provides_photography')
    ? ['photographer']
    : []

  function getEntry(id) {
    return contractors[id] ?? { cost: '', markup: String(CONTRACTOR_MARKUP_RATE * 100), committed: false }
  }

  function setEntry(id, patch) {
    onChange('contractors', {
      ...contractors,
      [id]: { ...getEntry(id), ...patch },
    })
  }

  function handleCheck(id, checked) {
    if (checked) {
      // Open entry with defaults, not yet committed
      setEntry(id, { cost: '', markup: String(CONTRACTOR_MARKUP_RATE * 100), committed: false })
    } else {
      // Remove entirely
      const next = { ...contractors }
      delete next[id]
      onChange('contractors', next)
    }
  }

  function handleCommit(id) {
    const entry = getEntry(id)
    if (!entry.cost || Number(entry.cost) <= 0) return
    setEntry(id, { committed: true })
  }

  function handleUncommit(id) {
    setEntry(id, { committed: false })
  }

  return (
    <div className="space-y-0.5">
      {CONTRACTORS.map((contractor) => {
        const suppressed = suppressedIds.includes(contractor.id)
        const isOpen = !suppressed && contractor.id in contractors
        const entry = getEntry(contractor.id)
        const committed = isOpen && entry.committed
        const costNum = parseFloat(entry.cost) || 0
        const markupRate = (parseFloat(entry.markup) || CONTRACTOR_MARKUP_RATE * 100) / 100
        const billed = costNum * (1 + markupRate)

        return (
          <div key={contractor.id} className="rounded-lg overflow-hidden">
            {/* Main row */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => !suppressed && handleCheck(contractor.id, !isOpen)}
            >
              <Checkbox
                id={`contractor-${contractor.id}`}
                checked={isOpen}
                disabled={suppressed}
                onCheckedChange={(v) => handleCheck(contractor.id, v)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
              <Label
                htmlFor={`contractor-${contractor.id}`}
                className="flex-1 text-sm font-normal cursor-pointer select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {contractor.label}
                {suppressed && (
                  <span className="ml-2 text-xs text-muted-foreground">(provided by client)</span>
                )}
                {contractor.passThrough && !suppressed && (
                  <span className="ml-2 text-xs text-muted-foreground">pass-through</span>
                )}
              </Label>

                    {/* Inline inputs (open, not committed) */}
              {isOpen && !committed && (
                <div
                  className="flex items-center gap-2 ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Cost"
                    value={entry.cost}
                    onChange={(e) => setEntry(contractor.id, { cost: e.target.value })}
                    className="h-8 text-sm w-24 shrink-0"
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="10"
                    value={entry.markup}
                    onChange={(e) => setEntry(contractor.id, { markup: e.target.value })}
                    className="h-8 text-sm w-12 shrink-0 text-center"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs shrink-0"
                    disabled={!entry.cost || Number(entry.cost) <= 0}
                    onClick={() => handleCommit(contractor.id)}
                  >
                    Add
                  </Button>
                </div>
              )}

              {/* Committed summary inline */}
              {committed && costNum > 0 && (
                <div
                  className="flex items-center gap-2 ml-auto text-xs text-muted-foreground tabular-nums shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{fmt(costNum)}</span>
                  <span className="text-border">→</span>
                  <span className="font-medium text-foreground">{fmt(billed)}</span>
                  <button
                    className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleUncommit(contractor.id) }}
                    title="Edit"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
