"use client"

import React from "react"
import { cn } from "@/lib/utils"

type TerminalDockProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialHeight?: number
  storageKey?: string
  className?: string
  children: React.ReactNode
}

export function TerminalDock({
  isOpen,
  onOpenChange,
  initialHeight = 280,
  storageKey = "mongo.console.height",
  className,
  children,
}: TerminalDockProps) {
  const [height, setHeight] = React.useState<number>(() => {
    if (typeof window === "undefined") return initialHeight
    const saved = Number(localStorage.getItem(storageKey))
    return Number.isFinite(saved) && saved > 120 ? saved : initialHeight
  })
  const [dragging, setDragging] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onOpenChange])

  React.useEffect(() => {
    if (!dragging) return
    const startY = (window as any).__dockStartY ?? 0
    const startH = (window as any).__dockStartH ?? height
    function onMove(e: MouseEvent) {
      const dy = startY - e.clientY
      const newH = Math.max(160, Math.min(Math.round(startH + dy), Math.round(window.innerHeight * 0.85)))
      setHeight(newH)
    }
    function onUp() {
      setDragging(false)
      localStorage.setItem(storageKey, String(height))
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging, height, storageKey])

  function startDrag(e: React.MouseEvent) {
    ;(window as any).__dockStartY = e.clientY
    ;(window as any).__dockStartH = height
    setDragging(true)
    document.body.style.userSelect = "none"
  }

  if (!isOpen) return null

  return (
    <div
      className={cn("fixed inset-x-0 bottom-0 z-40 border-t bg-background shadow-lg flex flex-col", className)}
      style={{ height }}
      role="dialog"
      aria-label="Command Console"
    >
      <div
        className="h-6 shrink-0 cursor-row-resize select-none border-b bg-muted/50 hover:bg-muted transition-colors"
        onMouseDown={startDrag}
        title="Drag to resize"
      />
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-medium">Command Console</div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="Close console"
          title="Close (Esc)"
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}
