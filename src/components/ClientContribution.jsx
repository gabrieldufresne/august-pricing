import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Swatches,
  PencilLine,
  Camera,
  ClipboardText,
  CheckCircle,
} from '@phosphor-icons/react'
import { CLIENT_CONTRIBUTIONS, CATEGORIES } from '@/lib/pricingConfig'

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))

const ICONS = {
  existing_brand_assets: Swatches,
  client_provides_copy: PencilLine,
  client_provides_photography: Camera,
  technical_brief_provided: ClipboardText,
}

export function ClientContribution({ formData, onChange }) {
  const active = formData.clientContributions ?? []

  function handleToggle(id) {
    const next = active.includes(id)
      ? active.filter((v) => v !== id)
      : [...active, id]
    onChange('clientContributions', next)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CLIENT_CONTRIBUTIONS.map((contrib) => {
        const checked = active.includes(contrib.id)
        const Icon = ICONS[contrib.id]

        return (
          <motion.div
            key={contrib.id}
            onClick={() => handleToggle(contrib.id)}
            whileTap={{ scale: 0.98 }}
            animate={{
              backgroundColor: checked
                ? 'hsl(var(--foreground) / 0.04)'
                : 'hsl(var(--card))',
            }}
            transition={{ duration: 0.15 }}
            className={[
              'relative rounded-xl border p-4 cursor-pointer transition-colors duration-150',
              checked ? 'border-foreground' : 'border-border',
            ].join(' ')}
          >
            {/* Selected indicator */}
            {checked && (
              <CheckCircle
                weight="fill"
                size={16}
                className="absolute top-3 right-3 text-foreground"
              />
            )}

            {/* Icon */}
            {Icon && (
              <Icon
                weight={checked ? 'duotone' : 'regular'}
                size={28}
                className={checked ? 'text-foreground' : 'text-muted-foreground'}
              />
            )}

            {/* Label */}
            <p className="text-sm font-medium text-foreground mt-3">
              {contrib.label}
            </p>

            {/* Description */}
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {contrib.description}
            </p>

            {/* Discount pills */}
            {contrib.discounts && contrib.discounts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contrib.discounts.map((d, i) => (
                  <span
                    key={i}
                    className={[
                      'text-xs px-1.5 py-0.5 rounded-full transition-colors duration-150',
                      checked
                        ? 'bg-foreground/10 text-foreground font-medium'
                        : 'bg-muted text-muted-foreground/50',
                    ].join(' ')}
                  >
                    −{Math.round(d.pct * 100)}% {CATEGORY_LABELS[d.categoryId] ?? d.categoryId}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
