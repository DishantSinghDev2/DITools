"use client"

import { useEffect, useState } from "react"
import { useShortcuts } from "@/context/shortcuts"
import { comboToString, parseComboFromEvent, equals } from "@/lib/shortcuts"
import { detectOS } from "@/lib/os"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Keyboard, Settings2 } from "lucide-react"

type Row = { actionId: string; title: string; description?: string }

const ACTIONS: Row[] = [
  { actionId: "shortcuts.open-settings", title: "Open Shortcuts Settings" },
  { actionId: "mongo.run-query", title: "Run Query" },
  { actionId: "mongo.toggle-ai", title: "Toggle AI Panel" },
  { actionId: "mongo.open-import", title: "Open Import" },
  { actionId: "mongo.open-export", title: "Open Export" },
  { actionId: "mongo.toggle-bulk", title: "Toggle Bulk Editor" },
  { actionId: "mongo.page-next", title: "Next Page" },
  { actionId: "mongo.page-prev", title: "Previous Page" },
  { actionId: "mongo.copy-doc", title: "Copy Selected Doc JSON" },
]

export function ShortcutSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const os = detectOS()
  const { shortcuts, setShortcut, resetShortcuts } = useShortcuts()
  const [captureFor, setCaptureFor] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)

  useEffect(() => {
    if (!captureFor) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const combo = parseComboFromEvent(e)
      const modifier = combo.ctrl || combo.meta || combo.alt || combo.shift
      const functional = /^F\d{1,2}$/.test(combo.key) || combo.key === "Enter" || combo.key === "Escape"
      if (!modifier && !functional) return
      // conflict detection
      for (const [act, combos] of Object.entries(shortcuts)) {
        if (act === captureFor) continue
        if (combos?.some((c) => equals(c, combo))) {
          setConflict(`Conflicts with ${act}`)
          break
        } else {
          setConflict(null)
        }
      }
      setShortcut(captureFor, combo, 0)
      setCaptureFor(null)
    }
    window.addEventListener("keydown", onKey, { capture: true })
    return () => window.removeEventListener("keydown", onKey, { capture: true } as any)
  }, [captureFor, shortcuts, setShortcut])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Customize shortcuts. Settings are stored in your browser only.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid grid-cols-1 gap-4">
            {ACTIONS.map((row) => {
              const current = shortcuts[row.actionId]?.[0]
              return (
                <div key={row.actionId} className="flex items-center justify-between gap-3 border rounded-md p-3">
                  <div>
                    <div className="font-medium">{row.title}</div>
                    {row.description ? <div className="text-sm text-muted-foreground">{row.description}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground min-w-[140px] text-right">
                      {current ? comboToString(current) : "Unassigned"}
                    </div>
                    <Button variant="secondary" onClick={() => setCaptureFor(row.actionId)}>
                      {captureFor === row.actionId ? "Press keys…" : "Rebind"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        {conflict ? <div className="text-amber-600 text-sm">Warning: {conflict}</div> : null}
        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={resetShortcuts}>
            Restore Defaults
          </Button>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            OS-aware labels are shown automatically. Example: {os === "mac" ? "⌘" : "Ctrl"} + K
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
