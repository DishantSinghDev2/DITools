"use client"

import type React from "react"

import { useMemo, useState } from "react"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <h3 className="font-medium text-sm">{title}</h3>
      {children}
    </div>
  )
}

function KeyVal({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-xs grid grid-cols-2 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono break-all">{String(value)}</span>
    </div>
  )
}

export function DetailsPanel({
  server,
  serverLoading,
  serverError,
  dbStats,
  dbLoading,
  dbError,
  collStats,
  collLoading,
  collError,
  indexes,
  indexesLoading,
  indexesError,
}: {
  server: any
  serverLoading: boolean
  serverError: any
  dbStats: any
  dbLoading: boolean
  dbError: any
  collStats: any
  collLoading: boolean
  collError: any
  indexes: any[]
  indexesLoading: boolean
  indexesError: any
}) {
  const [tab, setTab] = useState<"server" | "db" | "coll" | "idx">("server")

  const serverSummary = useMemo(() => {
    if (!server) return null
    return {
      version: server?.buildInfo?.version || server?.hello?.version || server?.version,
      gitVersion: server?.buildInfo?.gitVersion,
      openssl: server?.buildInfo?.openssl,
      modules: server?.buildInfo?.modules?.join(", "),
      allocator: server?.buildInfo?.allocator,
      javascriptEngine: server?.buildInfo?.javascriptEngine,
      sysInfo: server?.buildInfo?.sysInfo,
    }
  }, [server])

  const dbSummary = useMemo(() => {
    if (!dbStats) return null
    return {
      db: dbStats?.db,
      collections: dbStats?.collections,
      objects: dbStats?.objects,
      dataSize: dbStats?.dataSize,
      storageSize: dbStats?.storageSize,
      indexes: dbStats?.indexes,
      indexSize: dbStats?.indexSize,
    }
  }, [dbStats])

  const collSummary = useMemo(() => {
    if (!collStats) return null
    return {
      ns: collStats?.ns,
      count: collStats?.count,
      size: collStats?.size,
      storageSize: collStats?.storageSize,
      wiredTiger: collStats?.wiredTiger ? "[present]" : undefined,
      nindexes: collStats?.nindexes,
      totalIndexSize: collStats?.totalIndexSize,
      capped: collStats?.capped,
    }
  }, [collStats])

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <button
          className={`rounded border px-2 py-1 text-xs ${tab === "server" ? "bg-muted" : ""}`}
          onClick={() => setTab("server")}
        >
          Server
        </button>
        <button
          className={`rounded border px-2 py-1 text-xs ${tab === "db" ? "bg-muted" : ""}`}
          onClick={() => setTab("db")}
        >
          Database
        </button>
        <button
          className={`rounded border px-2 py-1 text-xs ${tab === "coll" ? "bg-muted" : ""}`}
          onClick={() => setTab("coll")}
        >
          Collection
        </button>
        <button
          className={`rounded border px-2 py-1 text-xs ${tab === "idx" ? "bg-muted" : ""}`}
          onClick={() => setTab("idx")}
        >
          Indexes
        </button>
      </div>

      {tab === "server" && (
        <Section title="Server Info">
          {serverError && <p className="text-xs text-red-500 break-all">{String(serverError)}</p>}
          {serverLoading && <p className="text-xs text-muted-foreground">Loading server info…</p>}
          {!serverLoading && serverSummary && (
            <div className="space-y-1">
              {Object.entries(serverSummary)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => (
                  <KeyVal key={k} label={k} value={v} />
                ))}
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">Raw</summary>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted/50 p-2 rounded">
                  {JSON.stringify(server, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </Section>
      )}

      {tab === "db" && (
        <Section title="Database Stats">
          {dbError && <p className="text-xs text-red-500 break-all">{String(dbError)}</p>}
          {dbLoading && <p className="text-xs text-muted-foreground">Loading db stats…</p>}
          {!dbLoading && dbSummary && (
            <div className="space-y-1">
              {Object.entries(dbSummary)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => (
                  <KeyVal key={k} label={k} value={v} />
                ))}
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">Raw</summary>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted/50 p-2 rounded">
                  {JSON.stringify(dbStats, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </Section>
      )}

      {tab === "coll" && (
        <Section title="Collection Stats">
          {collError && <p className="text-xs text-red-500 break-all">{String(collError)}</p>}
          {collLoading && <p className="text-xs text-muted-foreground">Loading collection stats…</p>}
          {!collLoading && collSummary && (
            <div className="space-y-1">
              {Object.entries(collSummary)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => (
                  <KeyVal key={k} label={k} value={v} />
                ))}
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">Raw</summary>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted/50 p-2 rounded">
                  {JSON.stringify(collStats, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </Section>
      )}

      {tab === "idx" && (
        <Section title="Indexes">
          {indexesError && <p className="text-xs text-red-500 break-all">{String(indexesError)}</p>}
          {indexesLoading && <p className="text-xs text-muted-foreground">Loading indexes…</p>}
          {!indexesLoading && (
            <div className="space-y-2">
              {(indexes || []).map((idx: any) => (
                <div key={idx?.name} className="rounded border p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{idx?.name}</span>
                    <span className="text-muted-foreground">{idx?.unique ? "unique" : ""}</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted/50 p-2 rounded mt-1">
                    {JSON.stringify(idx?.key, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
