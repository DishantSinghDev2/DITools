"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Item = { id: string; label: string }
export function SidebarNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string>(items[0]?.id)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      let current = items[0]?.id
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= 120) current = it.id
      }
      if (current) setActive(current)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [items])

  return (
    <aside className="w-full md:w-64 md:shrink-0 md:border-r md:border-border">
      <div className="md:hidden flex justify-between items-center py-3">
        <h2 className="text-sm font-medium">On this page</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm underline"
          aria-expanded={open}
          aria-controls="docs-sidebar-list"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      <nav id="docs-sidebar-list" className={cn("md:block", open ? "block" : "hidden")} aria-label="On this page">
        <ul className="space-y-1 md:py-4">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={cn(
                  "block rounded px-2 py-1 text-sm",
                  active === it.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
