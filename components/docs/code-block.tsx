"use client"

import { useState } from "react"

export function CodeBlock({
  code,
  language = "json",
  label,
}: {
  code: string
  language?: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="relative">
      <pre
        className="rounded border border-border bg-muted p-3 text-xs overflow-x-auto"
        aria-label={`${language} code example`}
      >
        {label ? <div className="mb-2 text-[11px] uppercase text-muted-foreground">{label}</div> : null}
        <code>{code}</code>
      </pre>
      <button
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded border bg-background hover:bg-muted"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          } catch {}
        }}
        aria-live="polite"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
