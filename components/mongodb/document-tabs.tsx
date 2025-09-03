"use client"

import { X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

export type DocTab = { id: string; db: string; collection: string; label?: string }

export function DocumentTabs({
  tabs,
  activeId,
  onActivate,
  onClose,
  className,
  persistKey = "mongo:tabs",
}: {
  tabs: DocTab[]
  activeId?: string
  onActivate: (id: string) => void
  onClose: (id: string) => void
  className?: string
  persistKey?: string
}) {
  const [localTabs, setLocalTabs] = useState<DocTab[]>(tabs)

  useEffect(() => setLocalTabs(tabs), [tabs])

  useEffect(() => {
    try {
      sessionStorage.setItem(persistKey, JSON.stringify(localTabs))
    } catch {}
  }, [localTabs, persistKey])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(persistKey)
      if (raw) {
        const parsed = JSON.parse(raw || "[]")
        if (Array.isArray(parsed) && parsed.length) {
          // hydrate only if parent has no tabs
          if (!tabs?.length) setLocalTabs(parsed)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayTabs = useMemo(
    () =>
      localTabs.map((t) => ({
        ...t,
        label: t.label || `${t.collection} ${t.id.slice(0, 8)}`,
      })),
    [localTabs],
  )

  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto border-b bg-muted/40 px-2", className)}>
      {displayTabs.map((t) => {
        const isActive = t.id === activeId
        return (
          <button
            key={`${t.collection}:${t.id}`}
            onClick={() => onActivate(t.id)}
            className={cn(
              "group flex items-center gap-2 rounded-t border px-2 py-1 text-xs",
              isActive ? "bg-background" : "bg-muted hover:bg-muted/70",
            )}
            title={`${t.db}.${t.collection} • ${t.id}`}
          >
            <span className="font-mono">{t.label}</span>
            <X
              className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onClose(t.id)
              }}
            />
          </button>
        )
      })}
      {!displayTabs.length && (
        <div className="text-xs text-muted-foreground px-2 py-1">Open a document from the sidebar to start</div>
      )}
    </div>
  )
}
