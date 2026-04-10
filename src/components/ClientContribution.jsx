import * as React from 'react'
import { Switch } from '@/components/ui/switch'
import { CLIENT_CONTRIBUTIONS } from '@/lib/pricingConfig'

export function ClientContribution({ formData, onChange }) {
  const active = formData.clientContributions ?? []

  function handleToggle(id) {
    const next = active.includes(id)
      ? active.filter((v) => v !== id)
      : [...active, id]
    onChange('clientContributions', next)
  }

  return (
    <div className="space-y-1">
      {CLIENT_CONTRIBUTIONS.map((contrib) => {
        const checked = active.includes(contrib.id)
        return (
          <div
            key={contrib.id}
            className="flex items-start justify-between gap-4 rounded-lg px-3 py-3 hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={() => handleToggle(contrib.id)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{contrib.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {contrib.description}
              </p>
            </div>
            <Switch
              checked={checked}
              onCheckedChange={() => handleToggle(contrib.id)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 mt-0.5"
            />
          </div>
        )
      })}
    </div>
  )
}
