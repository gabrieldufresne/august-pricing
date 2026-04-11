import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt = (n) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n)

export function FloatingEstimateBar({ result }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  return (
    <>
      {/* Floating bar */}
      <motion.div
        layoutId="estimate-panel"
        layout
        className="fixed z-50 lg:hidden cursor-pointer rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-xl"
        style={{
          bottom: 'calc(1rem + env(safe-area-inset-bottom))',
          left: '1rem',
          right: '1rem',
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <div className="px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Grand Total
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">
              {fmt(result.grandTotalLow)} – {fmt(result.grandTotalHigh)}
            </span>
            <svg
              className="w-3.5 h-3.5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) {
                  setDrawerOpen(false)
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border shadow-xl overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag handle */}
              <div className="pt-3 pb-1 flex justify-center" onClick={() => setDrawerOpen(false)}>
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="px-5 pt-2 pb-3 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Breakdown
                </p>
              </div>

              {/* Line items */}
              <div className="px-5 py-2 max-h-[55vh] overflow-y-auto">
                <div className="divide-y divide-border">
                  {result.lineItems.map((item) => (
                    <div key={item.categoryId} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {item.label}
                        </span>
                        {item.isBundle && (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            Bundle
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium tabular-nums text-foreground shrink-0 ml-4">
                        {fmt(item.adjLow)} – {fmt(item.adjHigh)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand total */}
              <div className="mx-5 mb-4 mt-2 rounded-lg bg-foreground px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-background/60">
                    Grand Total
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-background">
                    {fmt(result.grandTotalLow)} – {fmt(result.grandTotalHigh)}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
