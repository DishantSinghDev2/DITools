// components/mongodb/document-tabs.tsx
"use client"

import { X } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

export type DocTab = { id: string; db: string; collection: string; label?: string }

export function DocumentTabs({
  tabs,
  activeId,
  onActivate,
  onClose,
  className,
}: {
  tabs: DocTab[]
  activeId?: string
  onActivate: (id: string) => void
  onClose: (id: string) => void
  className?: string
}) {
  // NO LOCAL STATE. This component now renders directly from its props.
  // The parent (MongoManagerPage) is the single source of truth.

  const displayTabs = useMemo(
    () =>
      tabs.map((t) => ({
        ...t,
        label: t.label || `${t.collection}/${t.id.slice(0, 6)}...`,
      })),
    [tabs],
  )

  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto border-b bg-muted/40 px-2 shrink-0", className)}>
      {displayTabs.map((t) => {
        const isActive = t.id === activeId
        return (
          <button
            key={`${t.collection}:${t.id}`}
            onClick={() => onActivate(t.id)}
            className={cn(
              "group flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-0 px-3 py-1.5 text-xs transition-colors",
              isActive ? "bg-background border" : "bg-muted hover:bg-background/60 border border-transparent",
            )}
            title={`${t.db}.${t.collection} • ${t.id}`}
          >
            <span className="font-mono">{t.label}</span>
            <X
              className="h-3.5 w-3.5 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onClose(t.id)
              }}
            />
          </button>
        )
      })}
      {!displayTabs.length && (
        <div className="text-xs text-muted-foreground px-2 py-1.5">No open documents</div>
      )}
    </div>
  )
}