import * as React from 'react'
import { AnimatePresence } from 'framer-motion'
import { EstimatorForm } from './components/EstimatorForm'
import { EstimateResult } from './components/EstimateResult'
import './index.css'

export default function App() {
  const [result, setResult] = React.useState(null)
  const resetRef = React.useRef(null)

  function handleReset() {
    if (resetRef.current) resetRef.current()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-screen-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
              August
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">Estimator</span>
          </div>
          <span className="text-xs text-muted-foreground">Internal · v1.0</span>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="mx-auto max-w-screen-xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-8 items-start">

          {/* LEFT — Form */}
          <div>
            <EstimatorForm onResultChange={setResult} onResetRef={resetRef} />
          </div>

          {/* RIGHT — Result (sticky) */}
          <div className="lg:sticky lg:top-[73px]">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Estimate
              </p>
              <AnimatePresence mode="wait">
                <EstimateResult
                  key={result ? 'has-result' : 'empty'}
                  result={result}
                  onReset={handleReset}
                />
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
