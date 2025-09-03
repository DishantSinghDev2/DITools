"use client"

import type { ReactNode } from "react"
import { useShortcuts } from "@/context/shortcuts"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function WithShortcutTooltip({
  actionId,
  children,
  label,
}: {
  actionId: string
  children: ReactNode
  label?: string
}) {
  const { comboLabel } = useShortcuts()
  const combo = comboLabel(actionId)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {label ? <span className="mr-2">{label}</span> : null}
            <span className="text-muted-foreground">{combo ?? "Unassigned"}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
