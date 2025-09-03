"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface DataGridProps {
  docs: any[]
  collection: string
  highlightId?: string | null
  onHighlightConsumed?: () => void
}

export function DataGrid({ docs, collection, highlightId, onHighlightConsumed }: DataGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!highlightId) return
    const el = document.getElementById(rowId(collection, String(highlightId)))
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      const t = setTimeout(() => onHighlightConsumed?.(), 2000)
      return () => clearTimeout(t)
    } else {
      onHighlightConsumed?.()
    }
  }, [highlightId, collection, onHighlightConsumed])

  return (
    <div ref={containerRef} className="space-y-2">
      <AnimatePresence initial={false}>
        {docs.map((doc) => {
          const id = String(doc?._id ?? "")
          const isHighlighted = highlightId && id === highlightId
          return (
            <motion.div
              key={id || Math.random()}
              id={rowId(collection, id)}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                backgroundColor: isHighlighted ? "rgba(250, 204, 21, 0.35)" : "transparent", // amber-400/35
              }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="rounded border bg-card"
            >
              <Card className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-mono text-muted-foreground">_id: {id || "(no id)"}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(id)}>
                      Copy _id
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(doc, null, 2))}
                    >
                      Copy JSON
                    </Button>
                  </div>
                </div>
                <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(doc, null, 2)}</pre>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function rowId(collection: string, id: string) {
  return `row-${collection}-${id}`
}
