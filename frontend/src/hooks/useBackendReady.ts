import { useEffect, useState } from "react"

export function useBackendReady(intervalMs = 2000) {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checking, setChecking] = useState(true)
  
    useEffect(() => {
      let cancelled = false
  
      async function poll() {
        try {
          const res = await fetch('http://localhost:8000/health')
          const json = await res.json()
  
          if (json.session_ready) {
            if (!cancelled) { setReady(true); setChecking(false) }
            return
          }
  
          if (json.session_error) {
            if (!cancelled) { setError(json.session_error); setChecking(false) }
            return
          }
        } catch {
            // not yet open...keep polling
        }
  
        if (!cancelled) setTimeout(poll, intervalMs)
      }
  
      poll()
      return () => { cancelled = true }
    }, [intervalMs])
  
    return { ready, checking, error }
  }