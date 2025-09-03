"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

const fetcher = async (url: string, body: any) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function DocumentViewer({
  connectionString,
  db,
  collection,
  id,
  className,
}: {
  connectionString: string
  db: string
  collection: string
  id: string
  className?: string
}) {
  const { data, error, isLoading, mutate } = useSWR(
    connectionString && db && collection && id
      ? [
          "/mongodb/api/find",
          {
            connectionString,
            db,
            collection,
            limit: 1,
            skip: 0,
            filter: { _id: { $oid: id } },
          },
        ]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const doc = data?.data?.[0] || null
  const [mode, setMode] = useState<"json" | "kv">("json")

  const kvPairs = useMemo(() => {
    if (!doc) return []
    const pairs: Array<{ k: string; v: string }> = []
    function walk(o: any, path: string[] = []) {
      if (o && typeof o === "object") {
        if (Array.isArray(o)) {
          o.forEach((v, i) => walk(v, [...path, String(i)]))
        } else {
          for (const [k, v] of Object.entries(o)) walk(v, [...path, k])
        }
      } else {
        pairs.push({ k: path.join("."), v: String(o) })
      }
    }
    walk(doc)
    return pairs
  }, [doc])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Document {id?.slice?.(0, 8) ?? ""}</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={mode === "json" ? "default" : "outline"} onClick={() => setMode("json")}>
            JSON
          </Button>
          <Button size="sm" variant={mode === "kv" ? "default" : "outline"} onClick={() => setMode("kv")}>
            Key/Value
          </Button>
          <Button size="sm" variant="outline" onClick={() => mutate()} title="Refresh document">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading document…</div>}
        {error && <div className="text-sm text-red-600">Error: {(error as Error).message}</div>}
        {!isLoading && !error && !doc && <div className="text-sm text-muted-foreground">No document found.</div>}
        {doc && mode === "json" && (
          <pre className="text-xs leading-5 overflow-x-auto rounded bg-muted p-3">{JSON.stringify(doc, null, 2)}</pre>
        )}
        {doc && mode === "kv" && (
          <div className="text-xs leading-5 overflow-x-auto rounded bg-muted p-3 space-y-1">
            {kvPairs.map((p) => (
              <div key={p.k} className="flex items-center gap-3">
                <div className="font-mono text-muted-foreground w-64 truncate">{p.k}</div>
                <div className="font-mono break-all">{p.v}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentViewer
