import * as React from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
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
          <LayoutGroup id="estimate">
            <motion.div ref={panelRef} layoutId="estimate-panel" layout className="lg:sticky lg:top-[73px]">
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
            </motion.div>

            <AnimatePresence>
              {result && !isEstimatePanelVisible && (
                <FloatingEstimateBar result={result} />
              )}
            </AnimatePresence>
          </LayoutGroup>

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
