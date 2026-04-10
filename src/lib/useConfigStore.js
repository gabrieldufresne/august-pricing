// =============================================================================
// useConfigStore.js — August Estimator
// Manages the editable pricing config with localStorage persistence.
// =============================================================================

import * as React from 'react'
import { DEFAULT_CONFIG } from './configDefaults.js'

const STORAGE_KEY = 'august-estimator-config-v2'

export function useConfigStore() {
  const [config, setConfig] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return DEFAULT_CONFIG
      // Shallow merge with defaults so any new top-level keys added in the future
      // are present even when an older stored config is loaded.
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_CONFIG
    }
  })

  // Persist on every config change
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      // Storage full or private browsing — silently ignore
    }
  }, [config])

  function resetConfig() {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { config, setConfig, resetConfig }
}
