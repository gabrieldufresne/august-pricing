import * as React from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { ChevronDown, Copy, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const numberFmt = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
})

function fmt(n) {
  return numberFmt.format(n)
}

// Animated number — springs to new value on change
function AnimatedPrice({ value, className }) {
  const motionVal = useMotionValue(value)
  const [display, setDisplay] = React.useState(fmt(value))

  React.useEffect(() => {
    const controls = animate(motionVal, value, {
      type: 'spring',
      stiffness: 120,
      damping: 20,
    })
    const unsub = motionVal.on('change', (v) => setDisplay(fmt(Math.round(v))))
    return () => { controls.stop(); unsub() }
  }, [value])

  return <span className={className}>{display}</span>
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

// ---------------------------------------------------------------------------
// CollapsibleSection — local accordion primitive (no dependency on shadcn)
// ---------------------------------------------------------------------------

function CollapsibleSection({ title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          {badge != null && (
            <span className="text-xs text-muted-foreground tabular-nums">{badge}</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-secondary mb-4" />
      <p className="text-sm font-medium text-foreground mb-1">No services selected</p>
      <p className="text-xs text-muted-foreground">
        Choose services on the left to generate an estimate
      </p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// EstimateResult
// ---------------------------------------------------------------------------

export function EstimateResult({ result, onReset }) {
  const [copied, setCopied] = React.useState(false)

  if (!result) return <EmptyState />

  // --- Copy to clipboard ---
  function handleCopy() {
    const lines = []
    const scopeLabel = result.scopeType === 'campaign' ? 'Campaign / Project' : 'Full Engagement'
    lines.push(`August Estimator — ${result.projectName || 'Untitled'} (${scopeLabel})`)
    if (result.projectObjective) lines.push(result.projectObjective)
    lines.push('')
    lines.push(`August Fee: ${fmt(result.augustFeeLow)} – ${fmt(result.augustFeeHigh)} CAD`)
    lines.push('')
    lines.push('BREAKDOWN')
    for (const item of result.lineItems) {
      const range = `${fmt(item.adjLow)} – ${fmt(item.adjHigh)}`
      const meta = [item.complexity, `×${item.multiplier}`]
      if (item.platform) meta.push(item.platform)
      lines.push(`${item.label}: ${range} (${meta.join(', ')})`)
      for (const d of item.discounts ?? []) {
        lines.push(`  – ${d.label}: −${d.pct}%`)
      }
    }

    if (result.appliedDiscounts?.length > 0) {
      lines.push('')
      lines.push('DISCOUNTS')
      for (const d of result.appliedDiscounts) {
        const suffix = d.type === '%' ? `−${d.value}%` : `−${fmt(d.value)}`
        lines.push(`${d.label}: ${suffix}`)
      }
    }

    if (result.contractors?.length > 0) {
      lines.push('')
      lines.push('PARTNER SERVICES')
      for (const c of result.contractors) {
        lines.push(`${c.label}: ${fmt(c.cost)} cost → ${fmt(c.billed)} billed`)
      }
      lines.push(`Partner Total: ${fmt(result.partnerTotal)}`)
    }

    lines.push('')
    lines.push(`GRAND TOTAL: ${fmt(result.grandTotalLow)} – ${fmt(result.grandTotalHigh)} CAD`)

    if (result.flags?.length > 0) {
      lines.push('')
      lines.push('FLAGS')
      for (const f of result.flags) {
        lines.push(`- ${f}`)
      }
    }

    if (result.notes) {
      lines.push('')
      lines.push(`Notes: ${result.notes}`)
    }

    lines.push('')
    lines.push(`Generated: ${new Date().toLocaleDateString('en-CA', { dateStyle: 'long' })}`)

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const hasDiscounts = result.appliedDiscounts?.length > 0
  const hasContractors = result.contractors?.length > 0
  const hasFlags = result.flags?.length > 0

  return (
    <motion.div
      key="result"
      variants={stagger}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-5"
    >
      {/* 1. Price Range Hero */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            August Fee
          </p>
          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
            result.scopeType === 'campaign'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-secondary text-muted-foreground'
          )}>
            {result.scopeType === 'campaign' ? 'Campaign / Project' : 'Full Engagement'}
          </span>
        </div>
        <p className="text-[28px] font-semibold tracking-tight tabular-nums leading-none">
          <AnimatedPrice value={result.augustFeeLow} />
          {' – '}
          <AnimatedPrice value={result.augustFeeHigh} />
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">CAD · before partner costs</p>
      </motion.div>

      {/* 2. Applied Discounts */}
      {hasDiscounts && (
        <motion.div variants={fadeUp} className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Discounts applied
          </p>
          <div className="rounded-lg border border-border divide-y divide-border">
            {result.appliedDiscounts.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-foreground">{d.label}</span>
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {d.type === '%' ? `−${d.value}%` : `−${fmt(d.value)}`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3. Itemized Breakdown */}
      <motion.div variants={fadeUp}>
        <CollapsibleSection
          title="Breakdown"
          badge={`${result.lineItems.length} ${result.lineItems.length === 1 ? 'category' : 'categories'}`}
          defaultOpen={true}
        >
          <div className="divide-y divide-border">
            {result.lineItems.map((item) => (
              <div key={item.categoryId} className="px-4 py-3">
                {/* Main row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      {item.isBundle && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          Bundle
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                      {item.complexity} complexity · ×{item.multiplier}
                      {item.platform && ` · ${item.platform}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="text-xs font-medium text-foreground">
                      {fmt(item.adjLow)}
                    </p>
                    <p className="text-xs text-muted-foreground">– {fmt(item.adjHigh)}</p>
                  </div>
                </div>

                {/* Client contribution discount rows */}
                {item.discounts?.length > 0 && (
                  <div className="mt-2 space-y-0.5 pl-3 border-l-2 border-border">
                    {item.discounts.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{d.label}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">−{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* 4. Partner Services */}
      {hasContractors && (
        <motion.div variants={fadeUp}>
          <CollapsibleSection title="Partner Services" defaultOpen={true}>
            <div className="px-4 py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Contractor</th>
                    <th className="text-right pb-2 font-medium">Cost</th>
                    <th className="text-right pb-2 font-medium">Billed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.contractors.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5 text-foreground">{c.label}</td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">{fmt(c.cost)}</td>
                      <td className="py-1.5 text-right tabular-nums font-medium text-foreground">{fmt(c.billed)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td className="pt-2 font-semibold text-foreground">Partner Total</td>
                    <td />
                    <td className="pt-2 text-right tabular-nums font-semibold text-foreground">
                      {fmt(result.partnerTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CollapsibleSection>
        </motion.div>
      )}

      {/* 5. Grand Total */}
      <motion.div variants={fadeUp} className="rounded-lg bg-foreground px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-background/60 mb-1">
          Grand Total
        </p>
        <p className="text-xl font-semibold tracking-tight tabular-nums text-background leading-none">
          <AnimatedPrice value={result.grandTotalLow} />
          {' – '}
          <AnimatedPrice value={result.grandTotalHigh} />
        </p>
        <p className="text-[11px] text-background/60 mt-1">CAD · August fees + partner costs</p>
      </motion.div>

      {/* 6. Flags */}
      {hasFlags && (
        <motion.div variants={fadeUp} className="space-y-2">
          {result.flags.map((flag, i) => (
            <div
              key={i}
              className="flex gap-2.5 items-start rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{flag}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* 7. Actions */}
      <motion.div variants={fadeUp} className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy Estimate'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      </motion.div>
    </motion.div>
  )
}
