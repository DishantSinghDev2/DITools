// components/mongodb/terminal-dock.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalSquare, ChevronDown, X, CornerDownLeft, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function TerminalDock({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [height, setHeight] = useState(250)
  const dragRef = useRef(false)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const newHeight = window.innerHeight - e.clientY
      setHeight(Math.max(50, Math.min(newHeight, window.innerHeight - 100)))
    }
    const handleUp = () => {
      dragRef.current = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  return (
    <footer className={cn(
      "fixed bottom-0 left-0 right-0 bg-card border-t transition-transform duration-300 ease-in-out z-50",
      isOpen ? "translate-y-0" : "translate-y-[calc(100%-36px)]"
    )}>
      <div
        onMouseDown={() => dragRef.current = true}
        className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize"
      />
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-4 w-4" />
          <span className="text-sm font-medium">CONSOLE</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded hover:bg-muted-foreground/20">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      <div style={{ height: `${height}px` }} className="overflow-auto ">
        {children}
      </div>
    </footer>
  )
}