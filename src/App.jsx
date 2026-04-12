import * as React from 'react'
import { AnimatePresence } from 'framer-motion'

// Scalloped bottom edge — renders a row of upward semi-circles in bg color
// that visually "tears" the bottom of the receipt card
function ScallopedEdge() {
  let d = 'M0,14 L0,7'
  for (let x = 0; x < 400; x += 20) {
    d += ` Q${x + 5},0 ${x + 10},7 Q${x + 15},14 ${x + 20},7`
  }
  d += ' L400,14 Z'
  return (
    <div style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem', width: 'calc(100% + 3rem)', display: 'block' }}>
      <svg
        viewBox="0 0 400 14"
        preserveAspectRatio="none"
        width="100%"
        height="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={d} fill="hsl(var(--background))" />
      </svg>
    </div>
  )
}
import { EstimatorForm } from './components/EstimatorForm'
import { EstimateResult } from './components/EstimateResult'
import { FloatingEstimateBar } from './components/FloatingEstimateBar'
import { useConfigStore } from './lib/useConfigStore'
import { ConfigEditor } from './components/ConfigEditor'
import './index.css'

export default function App() {
  const [result, setResult] = React.useState(null)
  const resetRef = React.useRef(null)
  const { config, setConfig, resetConfig } = useConfigStore()
  const [editorOpen, setEditorOpen] = React.useState(false)

  const panelRef = React.useRef(null)
  const [isEstimatePanelVisible, setIsEstimatePanelVisible] = React.useState(false)

  React.useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsEstimatePanelVisible(entry.isIntersecting),
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setEditorOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit Config
            </button>
            <span className="text-xs text-muted-foreground">Internal · v1.0</span>
          </div>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="mx-auto max-w-screen-xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-8 items-start">

          {/* LEFT — Form */}
          <div>
            <EstimatorForm onResultChange={setResult} onResetRef={resetRef} config={config} />
          </div>

          {/* RIGHT — Result (sticky) */}
          <div ref={panelRef} className="lg:sticky lg:top-[73px]">
            <div className="rounded-t-xl bg-card pt-6 px-6 pb-0 overflow-visible">
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
              <ScallopedEdge />
            </div>
          </div>

          <AnimatePresence>
            {result && !isEstimatePanelVisible && (
              <FloatingEstimateBar result={result} />
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Config Editor */}
      <ConfigEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        config={config}
        onConfigChange={setConfig}
        onReset={resetConfig}
      />
    </div>
  )
}
