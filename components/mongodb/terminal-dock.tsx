"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalSquare, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function TerminalDock({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [height, setHeight] = useState(300)
  const dragRef = useRef(false)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const newHeight = window.innerHeight - e.clientY
      setHeight(Math.max(150, Math.min(newHeight, window.innerHeight - 50)))
    }
    const handleUp = () => { dragRef.current = false }
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [])

  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-card text-primary border-t border-primary/15 transition-transform duration-300 ease-in-out z-50 font-mono",
        isOpen ? "translate-y-0" : "translate-y-[calc(100%-28px)]"
      )}
    >
      <div
        onMouseDown={() => (dragRef.current = true)}
        className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize"
      />
      <div className="flex items-center justify-between px-3 py-1 border-b border-primary/15 bg-primary/7">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsOpen(true)}>
          <TerminalSquare className="h-4 w-4" />
          <span className="text-xs font-bold">CONSOLE</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-primary/10"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>
      <div
        style={{ height: `${height}px` }}
        className="overflow-auto bg-card text-sm"
      >
        {children}
      </div>
    </footer>
  )
}
