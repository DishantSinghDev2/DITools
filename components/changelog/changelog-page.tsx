"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChangelogEntry = {
  version: string
  date: string
  highlights?: string[]
  sections?: {
    title: string
    items: string[]
  }[]
  breakingChanges?: string[]
  links?: { label: string; href: string }[]
  badge?: "new" | "fix" | "improve" | "security"
}

export function ChangelogPage({
  toolName,
  toolHref,
  entries,
  className,
}: {
  toolName: string
  toolHref: string
  entries: ChangelogEntry[]
  className?: string
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter((e) => {
      const hay = [
        e.version,
        e.date,
        ...(e.highlights || []),
        ...(e.sections?.flatMap((s) => [s.title, ...s.items]) || []),
        ...(e.breakingChanges || []),
        ...(e.links?.map((l) => l.label) || []),
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [entries, query])

  return (
    <main className={cn("container mx-auto max-w-4xl px-4 py-8 space-y-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-pretty">{toolName} Changelog</h1>
          <p className="text-sm text-muted-foreground">
            Transparent updates and improvements. Use search to filter by version or keyword.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={toolHref} className="inline-flex">
            <Button variant="secondary">Back to {toolName}</Button>
          </Link>
          <Link href="/" className="inline-flex">
            <Button variant="ghost">Home</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search versions, features, fixes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
          aria-label="Search changelog"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((entry) => (
          <Card key={entry.version} id={`v-${entry.version.replaceAll(".", "-")}`} className="border">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono">v{entry.version}</span>
                  {entry.badge && (
                    <Badge
                      variant={
                        entry.badge === "security" ? "destructive" : entry.badge === "fix" ? "outline" : "default"
                      }
                    >
                      {entry.badge}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
              {entry.links && entry.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.links.map((l) => (
                    <Link key={l.href} href={l.href} target="_blank" className="inline-flex">
                      <Badge variant="secondary">{l.label}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {entry.highlights && entry.highlights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Highlights</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {entry.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.sections && entry.sections.length > 0 && (
                <Accordion type="multiple" className="w-full">
                  {entry.sections.map((s, i) => (
                    <AccordionItem key={i} value={`section-${i}`}>
                      <AccordionTrigger className="text-sm">{s.title}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {s.items.map((it, ii) => (
                            <li key={ii}>{it}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {entry.breakingChanges && entry.breakingChanges.length > 0 && (
                <div className="space-y-2 border rounded-md p-3">
                  <h4 className="text-sm font-semibold text-destructive">Breaking changes</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {entry.breakingChanges.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && <div className="text-sm text-muted-foreground">No entries match your search.</div>}
      </div>
    </main>
  )
}
