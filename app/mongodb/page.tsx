"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { PurgeBrowserData } from "@/components/purge-browser-data"
import { AIAssistant } from "./AIAssistant" // Import AIAssistant component
import { DesktopHint } from "@/components/desktop-hint"
import { useMobile } from "@/hooks/use-mobile"
import { DataGrid } from "@/components/mongodb/data-grid"
import { ConnectionsManager } from "@/components/mongodb/connections-manager"
import { DetailsPanel } from "@/components/mongodb/details-panel"
import { BulkOps } from "@/components/mongodb/bulk-ops"
import { CommandConsole } from "@/components/mongodb/command-console"
import { useShortcuts } from "@/context/shortcuts"
import { WithShortcutTooltip } from "@/components/with-shortcut-tooltip"
import { Keyboard, RefreshCw, Search } from "lucide-react"
import { SidebarTree } from "@/components/mongodb/sidebar-tree"
import { DocumentTabs, type DocTab } from "@/components/mongodb/document-tabs"
import { DocumentViewer } from "@/components/mongodb/document-viewer"
import { TerminalDock } from "@/components/mongodb/terminal-dock"
import { ShortcutSettingsDialog } from "@/components/settings/shortcut-settings-dialog"

type FindParams = {
  connStr: string
  db: string
  coll: string
  filter?: any
  projection?: any
  sort?: any
  limit?: number
  skip?: number
}

const fetcher = async (url: string, body: any) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

export default function MongoManagerPage() {
  const [connStr, setConnStr] = useState("")
  const [remember, setRemember] = useState(false)
  const [selectedDb, setSelectedDb] = useState("")
  const [selectedColl, setSelectedColl] = useState("")
  const [filter, setFilter] = useState("{ }")
  const [projection, setProjection] = useState("{ }")
  const [sort, setSort] = useState("{ }")
  const [limit, setLimit] = useState(100)
  const [skip, setSkip] = useState(0)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [quickSearch, setQuickSearch] = useState("")
  const [docTabs, setDocTabs] = useState<DocTab[]>([])
  const [activeDocId, setActiveDocId] = useState<string | undefined>(undefined)

  const [leftW, setLeftW] = useState(280)
  const [rightW, setRightW] = useState(360)
  const dragRef = useRef<{ side: "left" | "right" | null }>({ side: null })
  const isMobile = useMobile()

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current.side) return
      if (dragRef.current.side === "left") setLeftW(Math.max(220, Math.min(480, e.clientX)))
      if (dragRef.current.side === "right") setRightW(Math.max(280, Math.min(640, window.innerWidth - e.clientX)))
    }
    function onUp() {
      dragRef.current.side = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  useEffect(() => {
    if (remember) localStorage.setItem("mongo-manager:connStr", connStr)
    else localStorage.removeItem("mongo-manager:connStr")
  }, [remember, connStr])
  useEffect(() => {
    const saved = localStorage.getItem("mongo-manager:connStr")
    if (saved) {
      setConnStr(saved)
      setRemember(true)
    }
  }, [])

  const {
    data: dbs,
    isLoading: loadingDbs,
    mutate: reloadDbs,
    error: dbsError,
  } = useSWR(connStr ? ["/mongodb/api/databases", { connStr }] : null, ([url, body]) => fetcher(url, body))

  const {
    data: colls,
    isLoading: loadingColls,
    mutate: reloadColls,
    error: collsError,
  } = useSWR(connStr && selectedDb ? ["/mongodb/api/collections", { connStr, db: selectedDb }] : null, ([url, body]) =>
    fetcher(url, body),
  )

  const {
    data: serverInfo,
    isLoading: loadingServerInfo,
    error: serverError,
    mutate: reloadServer,
  } = useSWR(connStr ? ["/mongodb/api/serverInfo", { connStr }] : null, ([url, body]) => fetcher(url, body))

  const {
    data: dbStats,
    isLoading: loadingDbStats,
    error: dbStatsError,
    mutate: reloadDbStats,
  } = useSWR(connStr && selectedDb ? ["/mongodb/api/dbStats", { connStr, db: selectedDb }] : null, ([url, body]) =>
    fetcher(url, body),
  )

  const {
    data: collStats,
    isLoading: loadingCollStats,
    error: collStatsError,
    mutate: reloadCollStats,
  } = useSWR(
    connStr && selectedDb && selectedColl
      ? ["/mongodb/api/collStats", { connStr, db: selectedDb, collection: selectedColl }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const {
    data: idxList,
    isLoading: loadingIndexes,
    error: indexesError,
    mutate: reloadIndexes,
  } = useSWR(
    connStr && selectedDb && selectedColl
      ? ["/mongodb/api/indexes/list", { connStr, db: selectedDb, collection: selectedColl }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const {
    data: findResult,
    isLoading: loadingFind,
    mutate: reloadFind,
    error: findError,
  } = useSWR(
    connStr && selectedDb && selectedColl
      ? ["/mongodb/api/find", { connStr, db: selectedDb, coll: selectedColl }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  async function runInsertMany(docs: any[]) {
    const res = await fetcher("/mongodb/api/insertMany", {
      connStr,
      db: selectedDb,
      collection: selectedColl,
      docs,
    })
    try {
      const ids = res?.insertedIds
      if (ids) {
        const first = Array.isArray(ids) ? ids[0] : typeof ids === "object" ? Object.values(ids)[0] : null
        if (first) setHighlightId(String(first))
      }
    } catch {
      // ignore
    }
    await reloadFind()
  }

  async function runUpdateMany(payload: { filter: any; update: any; upsert?: boolean }) {
    await fetcher("/mongodb/api/updateMany", {
      connStr,
      db: selectedDb,
      collection: selectedColl,
      ...payload,
    })
    await reloadFind()
  }

  async function runDeleteMany(payload: { filter: any }) {
    await fetcher("/mongodb/api/deleteMany", {
      connStr,
      db: selectedDb,
      collection: selectedColl,
      ...payload,
    })
    await reloadFind()
  }

  async function runAggregate(pipelineText: string) {
    const pipeline = JSON.parse(pipelineText || "[]")
    return fetcher("/mongodb/api/aggregate", {
      connStr,
      db: selectedDb,
      collection: selectedColl,
      pipeline,
      limit,
    })
  }

  async function runCommand(commandText: string) {
    const cmd = JSON.parse(commandText || "{}")
    return fetcher("/mongodb/api/command", {
      connStr,
      db: selectedDb,
      command: cmd,
    })
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(findResult?.docs ?? [], null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedDb}-${selectedColl}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadCSV() {
    const docs = findResult?.docs ?? []
    if (!docs.length) return
    const fields = Array.from(
      docs.reduce((s: Set<string>, d: any) => {
        Object.keys(d).forEach((k) => s.add(k))
        return s
      }, new Set<string>()),
    )
    const rows = [fields.join(",")]
    for (const d of docs) {
      rows.push(fields.map((f) => JSON.stringify(d[f] ?? "")).join(","))
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedDb}-${selectedColl}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    const text = await file.text()
    let docs: any[] = []
    if (file.name.endsWith(".json")) {
      const parsed = JSON.parse(text)
      docs = Array.isArray(parsed) ? parsed : [parsed]
    } else if (file.name.endsWith(".csv")) {
      const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
      const fields = header.split(",").map((h) => h.trim())
      docs = lines.map((ln) => {
        const parts = ln.split(",")
        const obj: any = {}
        fields.forEach((f, i) => {
          obj[f] = JSON.parse(parts[i] || '""')
        })
        return obj
      })
    }
    if (docs.length) await runInsertMany(docs)
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent
      const id = ce?.detail?.id ?? ce?.detail?._id
      if (id) setHighlightId(String(id))
    }
    window.addEventListener("ai-jump-to-doc", handler as EventListener)
      ; (window as any).__mongoJumpToDoc = (id: string) =>
        window.dispatchEvent(new CustomEvent("ai-jump-to-doc", { detail: { id } }))
    return () => {
      window.removeEventListener("ai-jump-to-doc", handler as EventListener)
      try {
        delete (window as any).__mongoJumpToDoc
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    const onShowDashboard = () => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    window.addEventListener("mongo:show-dashboard", onShowDashboard as EventListener)
    return () => window.removeEventListener("mongo:show-dashboard", onShowDashboard as EventListener)
  }, [])

  const page = Math.floor((skip || 0) / (limit || 1)) + 1
  function nextPage() {
    setSkip((s) => (Number.isFinite(s) ? s + limit : limit))
  }
  function prevPage() {
    setSkip((s) => Math.max(0, (Number.isFinite(s) ? s : 0) - limit))
  }

  const { registerAction } = useShortcuts()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement | null>(null)
  const connsRef = useRef<HTMLDivElement | null>(null)
  const queryRef = useRef<HTMLDivElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const bulkRef = useRef<HTMLDivElement | null>(null)
  const cmdRef = useRef<HTMLDivElement | null>(null)

  const [view, setView] = useState({
    connections: true,
    queryBuilder: true,
    results: true,
    details: true,
    bulkOps: true,
    console: true,
    ai: true,
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mongo-manager:view")
      if (raw) setView((v) => ({ ...v, ...JSON.parse(raw) }))
    } catch { }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("mongo-manager:view", JSON.stringify(view))
    } catch { }
  }, [view])

  useEffect(() => {
    const offOpen = registerAction("shortcuts.open-settings", () => setShortcutsOpen(true))
    const offRun = registerAction("mongo.run-query", () => {
      if (!connStr || !selectedDb || !selectedColl || loadingFind) return
      reloadFind()
    })
    const offNext = registerAction("mongo.page-next", () => nextPage())
    const offPrev = registerAction("mongo.page-prev", () => prevPage())
    const offToggleAI = registerAction("mongo.toggle-ai", () => {
      aiRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      window.dispatchEvent(new CustomEvent("shortcut:mongo.toggle-ai"))
    })
    const offImport = registerAction("mongo.open-import", () =>
      window.dispatchEvent(new CustomEvent("shortcut:mongo.open-import")),
    )
    const offExport = registerAction("mongo.open-export", () =>
      window.dispatchEvent(new CustomEvent("shortcut:mongo.open-export")),
    )
    const offBulk = registerAction("mongo.toggle-bulk", () =>
      window.dispatchEvent(new CustomEvent("shortcut:mongo.toggle-bulk")),
    )
    const offConsole = registerAction("mongo.toggle-console", () => setView((v) => ({ ...v, console: !v.console })))
    return () => {
      offOpen()
      offRun()
      offNext()
      offPrev()
      offToggleAI()
      offImport()
      offExport()
      offBulk()
      offConsole()
    }
  }, [registerAction, connStr, selectedDb, selectedColl, loadingFind])

  const filteredDocs = useMemo(() => {
    const docs = findResult?.docs ?? []
    const q = quickSearch.trim().toLowerCase()
    if (!q) return docs
    return docs.filter((d: any) => JSON.stringify(d).toLowerCase().includes(q))
  }, [findResult?.docs, quickSearch])

  return (
    <main className="min-h-screen bg-background">
      <ShortcutSettingsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <header className="bg-primary text-primary-foreground py-4">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-pretty">MongoDB Manager</h1>
            <p className="text-xs text-primary-foreground/80">
              Advanced management with bulk edit, import/export, and command console.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WithShortcutTooltip actionId="shortcuts.open-settings" label="Shortcuts">
              <button
                aria-label="Open keyboard shortcuts"
                onClick={() => setShortcutsOpen(true)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-primary-foreground/10 inline-flex items-center gap-1"
              >
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
            </WithShortcutTooltip>
            <a href="/" className="text-xs underline hover:opacity-80" title="Go to Redis Tester">
              Redis Tester
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 mt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium mr-1">View:</span>
            {[
              ["Connections", "connections"],
              ["Query", "queryBuilder"],
              ["Results", "results"],
              ["Details", "details"],
              ["Bulk", "bulkOps"],
              ["Console", "console"],
              ["AI", "ai"],
            ].map(([label, key]) => (
              <label
                key={key}
                className="inline-flex items-center gap-1 rounded border px-2 py-1 bg-primary-foreground/10"
              >
                <input
                  type="checkbox"
                  checked={(view as any)[key]}
                  onChange={(e) => setView((v) => ({ ...v, [key]: e.target.checked }) as any)}
                />
                <span>{label}</span>
              </label>
            ))}
            <button
              className="ml-2 rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() =>
                setView({
                  connections: true,
                  queryBuilder: true,
                  results: true,
                  details: true,
                  bulkOps: true,
                  console: true,
                  ai: true,
                })
              }
            >
              Reset Layout
            </button>

            <span className="font-medium ml-4 mr-1">Jump:</span>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => connsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Connections
            </button>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => queryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Query
            </button>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Results
            </button>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Details
            </button>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => bulkRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Bulk
            </button>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => setView((v) => ({ ...v, console: true }))}
              title="Open Console"
            >
              Console
            </button>
            <button
              className="rounded border px-2 py-1 hover:bg-primary-foreground/10"
              onClick={() => aiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              AI
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="rounded-md border bg-card text-card-foreground p-3">
          <p className="text-sm font-medium">Security & Privacy</p>
          <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5 space-y-1">
            <li>
              Your connection string is used only for the duration of each request and is never stored or logged by the
              app. Operations are stateless and transient.
            </li>
            <li>
              We do not know what you are doing and your data does not go anywhere beyond your browser and the target
              database you explicitly connect to.
            </li>
            <li>
              For production, use least-privilege users and read-only roles where possible. Avoid untrusted networks.
            </li>
          </ul>
          <PurgeBrowserData />
        </div>
      </section>

      <DesktopHint />

      <section className="mx-auto max-w-none px-0">
        <div className={isMobile ? "flex flex-col" : "flex h-[calc(100vh-200px)]"}>
          {view.connections && (
            <aside
              ref={connsRef}
              style={isMobile ? undefined : { width: leftW }}
              className={isMobile ? "border-b p-0" : "border-r shrink-0 p-0"}
            >
              <div className="p-3 space-y-3">
                <ConnectionsManager
                  current={connStr}
                  onSelect={(str) => {
                    setConnStr(str)
                    setSelectedDb("")
                    setSelectedColl("")
                    setSkip(0)
                    reloadDbs()
                  }}
                />
                <div className="space-y-2 px-1">
                  <label className="text-xs font-medium">Connection string</label>
                  <input
                    type="password"
                    value={connStr}
                    onChange={(e) => setConnStr(e.target.value)}
                    placeholder="mongodb+srv://user:pass@host/"
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label htmlFor="remember" className="text-xs text-muted-foreground">
                      Remember in this browser
                    </label>
                    <button
                      className="ml-auto inline-flex items-center gap-1 text-xs rounded border px-2 py-1 hover:bg-muted"
                      onClick={() => reloadDbs()}
                      disabled={!connStr || loadingDbs}
                      title="Refresh connection"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <SidebarTree
                connStr={connStr}
                onSelectDatabase={(db) => {
                  setSelectedDb(db)
                  setSelectedColl("")
                  setSkip(0)
                  reloadColls()
                }}
                onSelectCollection={(db, coll) => {
                  setSelectedDb(db)
                  setSelectedColl(coll)
                  setSkip(0)
                  reloadFind()
                }}
                onSelectDocument={(db, coll, id) => {
                  setSelectedDb(db)
                  setSelectedColl(coll)
                  setSkip(0)
                  setDocTabs((tabs) => {
                    if (tabs.find((t) => t.id === id && t.collection === coll)) return tabs
                    return [...tabs, { id, db, collection: coll }]
                  })
                  setActiveDocId(id)
                  setHighlightId(id)
                }}
              />
            </aside>
          )}

          {!isMobile && view.connections && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => {
                dragRef.current.side = "left"
              }}
              className="w-1 cursor-col-resize bg-border hover:bg-primary/50"
              title="Drag to resize"
            />
          )}

          <section className={isMobile ? "min-w-0 flex flex-col" : "flex-1 min-w-0 flex flex-col"}>
            <DocumentTabs
              tabs={docTabs}
              activeId={activeDocId}
              onActivate={(id) => setActiveDocId(id)}
              onClose={(id) => {
                setDocTabs((t) => t.filter((x) => x.id !== id))
                if (activeDocId === id) setActiveDocId(undefined)
              }}
              className="sticky top-0 z-10"
            />
            <div ref={queryRef} className="border-b p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {view.queryBuilder && (
                <div>
                  <label className="text-xs font-medium">Filter (JSON)</label>
                  <textarea
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    rows={6}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-medium">Projection (JSON)</label>
                      <textarea
                        value={projection}
                        onChange={(e) => setProjection(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Sort (JSON)</label>
                      <textarea
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Limit</label>
                      <input
                        type="number"
                        value={limit}
                        min={1}
                        max={5000}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Skip</label>
                      <input
                        type="number"
                        value={skip}
                        min={0}
                        onChange={(e) => setSkip(Number(e.target.value))}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <WithShortcutTooltip actionId="mongo.run-query" label="Run Find">
                        <button
                          onClick={() => reloadFind()}
                          disabled={!connStr || !selectedDb || !selectedColl || loadingFind}
                          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                        >
                          {loadingFind ? "Running…" : "Run Find"}
                        </button>
                      </WithShortcutTooltip>

                      <button
                        onClick={downloadJSON}
                        disabled={!findResult?.docs?.length}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                      >
                        Export JSON
                      </button>
                      <button
                        onClick={downloadCSV}
                        disabled={!findResult?.docs?.length}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                      >
                        Export CSV
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <WithShortcutTooltip actionId="mongo.page-prev" label="Prev">
                          <button
                            onClick={prevPage}
                            disabled={!connStr || !selectedDb || !selectedColl || loadingFind || skip <= 0}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-60"
                          >
                            Prev
                          </button>
                        </WithShortcutTooltip>
                        <span className="text-xs text-muted-foreground">Page {page}</span>
                        <WithShortcutTooltip actionId="mongo.page-next" label="Next">
                          <button
                            onClick={nextPage}
                            disabled={
                              !connStr ||
                              !selectedDb ||
                              !selectedColl ||
                              loadingFind ||
                              (findResult?.docs?.length ?? 0) < limit
                            }
                            className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-60"
                          >
                            Next
                          </button>
                        </WithShortcutTooltip>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view.results && (
                <div ref={resultsRef} className="flex-1 min-h-0 overflow-auto p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <input
                        value={quickSearch}
                        onChange={(e) => setQuickSearch(e.target.value)}
                        placeholder="Search within results (client-side)"
                        className="w-full rounded-md border bg-background pl-8 pr-2 py-1.5 text-sm"
                      />
                      <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button
                      onClick={() => reloadFind()}
                      disabled={!connStr || !selectedDb || !selectedColl || loadingFind}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
                      title="Refresh results"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </button>
                  </div>
                  {findError && (
                    <p className="text-xs text-red-500 break-all mb-2">{String(findError.message || findError)}</p>
                  )}
                  {loadingFind && <p className="text-xs text-muted-foreground mb-2">Loading results…</p>}
                  <DataGrid
                    docs={filteredDocs}
                    collection={selectedColl}
                    highlightId={highlightId}
                    onHighlightConsumed={() => setHighlightId(null)}
                  />
                </div>
              )}
            </div>

            {!!activeDocId && connStr && selectedDb && selectedColl && (
              <div className="border-t p-3">
                <DocumentViewer connectionString={connStr} db={selectedDb} collection={selectedColl} id={activeDocId} />
              </div>
            )}
          </section>

          {!isMobile && view.details && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => {
                dragRef.current.side = "right"
              }}
              className="w-1 cursor-col-resize bg-border hover:bg-primary/50"
              title="Drag to resize"
            />
          )}

          {(view.details || view.bulkOps || view.ai) && (
            <aside
              style={isMobile ? undefined : { width: rightW }}
              className={isMobile ? "border-t p-3 space-y-3" : "border-l shrink-0 p-3 space-y-3"}
            >
              {view.details && (
                <div ref={detailsRef}>
                  <DetailsPanel
                    server={serverInfo}
                    serverLoading={loadingServerInfo}
                    serverError={serverError?.message || serverError}
                    dbStats={dbStats}
                    dbLoading={loadingDbStats}
                    dbError={dbStatsError?.message || dbStatsError}
                    collStats={collStats}
                    collLoading={loadingCollStats}
                    collError={collStatsError?.message || collStatsError}
                    indexes={idxList?.indexes ?? []}
                    indexesLoading={loadingIndexes}
                    indexesError={indexesError?.message || indexesError}
                  />
                </div>
              )}
              {view.bulkOps && (
                <div ref={bulkRef}>
                  <BulkOps
                    onInsertMany={runInsertMany}
                    onUpdateMany={runUpdateMany}
                    onDeleteMany={runDeleteMany}
                    onImportFile={handleImportFile}
                    disabled={!connStr || !selectedDb || !selectedColl}
                  />
                </div>
              )}
              {view.ai && (
                <div ref={aiRef} id="ai-panel">
                  <AIAssistant
                    connStrPresent={!!connStr}
                    selectedDb={selectedDb}
                    selectedColl={selectedColl}
                    collections={colls?.collections ?? []}
                    docs={(findResult?.docs ?? []).slice(0, 50)}
                    onExecutePlan={async (actions) => {
                      for (const action of actions) {
                        try {
                          if (action.type === "aggregate") {
                            await runAggregate(JSON.stringify(action.params?.pipeline ?? []))
                          } else if (action.type === "insertMany") {
                            await runInsertMany(action.params?.docs ?? [])
                          } else if (action.type === "updateMany") {
                            await runUpdateMany({
                              filter: action.params?.filter ?? {},
                              update: action.params?.update ?? {},
                              upsert: !!action.params?.upsert,
                            })
                          } else if (action.type === "deleteMany") {
                            await runDeleteMany({ filter: action.params?.filter ?? {} })
                          } else if (action.type === "command") {
                            await runCommand(JSON.stringify(action.params ?? {}))
                          }
                        } catch (e) {
                          console.error("[AI execute] action failed:", e)
                        }
                      }
                    }}
                  />
                </div>
              )}
            </aside>
          )}
        </div>
      </section>

      <TerminalDock isOpen={view.console} onOpenChange={(open) => setView((v) => ({ ...v, console: open }))}>
        <div ref={cmdRef} className="p-3">
          <CommandConsole onRun={runCommand} disabled={!connStr || !selectedDb} />
        </div>
      </TerminalDock>

      <footer className="bg-muted mt-8 py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} DishIs Technologies •{" "}
              <a
                href="https://dishis.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                dishis.tech
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              Use responsibly and only with systems you own or have permission to manage.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
