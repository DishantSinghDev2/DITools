"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

export function DesktopHint({
  className,
  storageKey = "desktop-hint-dismissed",
}: {
  className?: string
  storageKey?: string
}) {
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) {
      setOpen(false)
      return
    }
    try {
      const dismissed = localStorage.getItem(storageKey)
      setOpen(dismissed !== "true")
    } catch {
      setOpen(true)
    }
  }, [isMobile, storageKey])

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "true")
    } catch {}
    setOpen(false)
  }

  function shareOrCopy() {
    const url = window.location.href
    if (navigator.share) {
      navigator
        .share({
          title: "Open on Desktop",
          text: "Open this MongoDB Manager on desktop for advanced features.",
          url,
        })
        .catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).catch(() => {})
      alert("Link copied. Open on your desktop for the full experience.")
    }
  }

  if (!open) return null

  return (
    <div className={cn("fixed inset-x-2 bottom-2 z-40 md:hidden", className)} role="status" aria-live="polite">
      <div className="rounded-lg border bg-background/95 backdrop-blur p-3 shadow-md">
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-5 text-pretty">
            For advanced features (bulk edits, AI auto-execution, complex import/export, visual index tools), please use
            a desktop device. You can still browse and run basic queries on mobile.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={shareOrCopy}>
              Open on desktop
            </Button>
            <Button size="sm" variant="secondary" onClick={dismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
