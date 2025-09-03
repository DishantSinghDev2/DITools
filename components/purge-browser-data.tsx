"use client"

import { useState } from "react"

export function PurgeBrowserData() {
  const [done, setDone] = useState(false)
  const [working, setWorking] = useState(false)

  async function purge() {
    setWorking(true)
    try {
      // Clear storages
      localStorage.clear()
      sessionStorage.clear()

      // Clear caches if available
      if ("caches" in window) {
        const names = await caches.keys()
        await Promise.all(names.map((n) => caches.delete(n)))
      }

      // Attempt to unregister service workers (if any)
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }

      setDone(true)
    } catch {
      // No-op: best effort purge
      setDone(true)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="rounded-md border bg-card text-card-foreground p-3 mt-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Purge Browser Data</p>
          <p className="text-xs text-muted-foreground">
            Clear localStorage, sessionStorage, caches, and any registered service workers for this origin.
          </p>
        </div>
        <button
          onClick={purge}
          disabled={working}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
        >
          {working ? "Purging…" : "Purge now"}
        </button>
      </div>
      {done && (
        <p className="mt-2 text-xs text-green-600">
          Purge completed. You may reload the page to ensure a completely fresh session.
        </p>
      )}
    </div>
  )
}
