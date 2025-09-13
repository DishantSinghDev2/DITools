"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { AnimatePresence, motion } from "framer-motion"
import { PurgeBrowserData } from "@/components/purge-browser-data"
import { AIAssistant } from "./AIAssistant"
import { DesktopHint } from "@/components/desktop-hint"
import { useMobile } from "@/hooks/use-mobile"
import { DataGrid } from "@/components/mongodb/data-grid"
import { ConnectionsManager } from "@/components/mongodb/connections-manager"
import { DetailsPanel } from "@/components/mongodb/details-panel"
import { BulkOps } from "@/components/mongodb/bulk-ops"
import { CommandConsole } from "@/components/mongodb/command-console"
import { useShortcuts } from "@/context/shortcuts"
import { WithShortcutTooltip } from "@/components/with-shortcut-tooltip"
import { Keyboard, RefreshCw, Search, ChevronUp, ChevronDown, Pin, PinOff } from "lucide-react"
import { SidebarTree } from "@/components/mongodb/sidebar-tree"
import { DocumentTabs, type DocTab } from "@/components/mongodb/document-tabs"
import { DocumentViewer } from "@/components/mongodb/document-viewer"
import { TerminalDock } from "@/components/mongodb/terminal-dock"
import { ShortcutSettingsDialog } from "@/components/settings/shortcut-settings-dialog"
import { cn } from "@/lib/utils"

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

// Helper to safely parse JSON from a string
const safeParse = (str: string, fallback: any = {}) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return fallback
  }
}

export default function MongoManagerPage() {
  const [connStr, setConnStr] = useState("")
  const [remember, setRemember] = useState(false)
  const [selectedDb, setSelectedDb] = useState("")
  const [selectedColl, setSelectedColl] = useState("")
  const [filter, setFilter] = useState("{ }")
  const [projection, setProjection] = useState("{ }")
  const [sort, setSort] = useState("{ }")
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(20)

  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [quickSearch, setQuickSearch] = useState("")
  const [docTabs, setDocTabs] = useState<DocTab[]>([])
  const [activeDocId, setActiveDocId] = useState<string | undefined>(undefined)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [leftW, setLeftW] = useState(280)

  const [rightW, setRightW] = useState(360)
  const dragRef = useRef<{ side: "left" | "right" | null }>({ side: null })
  const isMobile = useMobile()

  // New state for header controls
  const [isHeaderToolsVisible, setIsHeaderToolsVisible] = useState(true)
  const [isHeaderPinned, setIsHeaderPinned] = useState(false)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current.side) return
      if (dragRef.current.side === "left") {
        const newWidth = e.clientX
        if (newWidth < 150) {
          setIsSidebarCollapsed(true)
          setLeftW(56)
        } else {
          setIsSidebarCollapsed(false)
          setLeftW(Math.max(220, Math.min(480, newWidth)))
        }
      }
      if (dragRef.current.side === "right") {
        setRightW(Math.max(280, Math.min(640, window.innerWidth - e.clientX)))
      }
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

  const query = useMemo(() => ({
    filter: safeParse(filter, {}),
    projection: safeParse(projection, {}),
    sort: safeParse(sort, {}),
  }), [filter, projection, sort])


  const {
    data: dbs,
    isLoading: loadingDbs,
    mutate: reloadDbs,
    error: dbsError,
  } = useSWR(connStr ? ["/mongodb/api/databases", { connStr }] : null, ([url, body]) => fetcher(url, body))

  const { data: countResult, mutate: reloadCount } = useSWR(
    connStr && selectedDb && selectedColl
      ? ["/mongodb/api/count", { connStr, db: selectedDb, coll: selectedColl, filter: query.filter }]
      : null,
    ([url, body]) => fetcher(url, body),
    { revalidateOnFocus: false }
  )


  const { data: colls } = useSWR(
    connStr && selectedDb ? ["/mongodb/api/collections", { connStr, db: selectedDb }] : null,
    ([url, body]) => fetcher(url, body),
  )

  const { data: serverInfo, isLoading: loadingServerInfo, error: serverError } = useSWR(
    connStr ? ["/mongodb/api/serverInfo", { connStr }] : null,
    ([url, body]) => fetcher(url, body),
  )

  const { data: dbStats, isLoading: loadingDbStats, error: dbStatsError } = useSWR(
    connStr && selectedDb ? ["/mongodb/api/dbStats", { connStr, db: selectedDb }] : null,
    ([url, body]) => fetcher(url, body),
  )

  const { data: collStats, isLoading: loadingCollStats, error: collStatsError } = useSWR(
    connStr && selectedDb && selectedColl
      ? ["/mongodb/api/collStats", { connStr, db: selectedDb, collection: selectedColl }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const { data: idxList, isLoading: loadingIndexes, error: indexesError } = useSWR(
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
      ? ["/mongodb/api/find", {
        connStr,
        db: selectedDb,
        coll: selectedColl,
        ...query,
        limit,
        skip
      }]
      : null,
    ([url, body]) => fetcher(url, body),
    { revalidateOnFocus: false }
  )


  async function runInsertMany(docs: any[]) {
    const res = await fetcher("/mongodb/api/insertMany", { connStr, db: selectedDb, collection: selectedColl, docs })
    try {
      const ids = res?.insertedIds
      if (ids) {
        const first = Array.isArray(ids) ? ids[0] : typeof ids === "object" ? Object.values(ids)[0] : null
        if (first) setHighlightId(String(first))
      }
    } catch { }
    await reloadFind()
  }

  async function runUpdateMany(payload: { filter: any; update: any; upsert?: boolean }) {
    await fetcher("/mongodb/api/updateMany", { connStr, db: selectedDb, collection: selectedColl, ...payload })
    await reloadFind()
  }

  async function runDeleteMany(payload: { filter: any }) {
    await fetcher("/mongodb/api/deleteMany", { connStr, db: selectedDb, collection: selectedColl, ...payload })
    await reloadFind()
  }

  async function handleUpdateDoc(id: any, update: object) {
    await fetcher("/mongodb/api/updateOne", { connStr, db: selectedDb, collection: selectedColl, filter: { _id: id }, update })
    reloadFind()
  }

  async function handleDeleteDoc(id: any) {
    await fetcher("/mongodb/api/deleteOne", { connStr, db: selectedDb, collection: selectedColl, filter: { _id: id } })
    reloadFind()
    reloadCount()
  }

  async function handleDuplicateDoc(doc: object) {
    const { _id, ...insertDoc } = doc
    await fetcher("/mongodb/api/insertOne", { connStr, db: selectedDb, collection: selectedColl, doc: insertDoc })
    reloadFind()
    reloadCount()
  }

  async function handleBulkDelete(ids: any[]) {
    await fetcher("/mongodb/api/deleteMany", {
      connStr,
      db: selectedDb,
      collection: selectedColl,
      filter: { _id: { $in: ids } },
    })
    reloadFind()
    reloadCount()
  }

  const handleRunQuery = () => {
    setSkip(0) // Go back to page 1
    reloadFind()
    reloadCount()
  }

  // FIX: The page change handler now correctly triggers a refetch because `skip` is in the SWR key.
  const handlePageChange = (newPage: number) => {
    setSkip((newPage - 1) * limit)
  }


  function handleConnectionChange(newConnStr: string) {
    if (newConnStr !== connStr) {
      setConnStr(newConnStr)
      setSelectedDb("")
      setSelectedColl("")
      setSkip(0)
      reloadDbs()
    }
  }

  const handleSelectCollection = (db: string, coll: string) => {
    if (selectedDb !== db || selectedColl !== coll) {
      setSelectedDb(db)
      setSelectedColl(coll)
      setSkip(0)
    }
  }

  const handleSelectDocument = (db: string, coll: string, id: string) => {
    if (!docTabs.some((t) => t.id === id)) {
      setDocTabs((prev) => [...prev, { id, db, collection: coll }])
    }
    setActiveDocId(id)
    setHighlightId(id)
  }

  async function runAggregate(pipelineText: string) {
    const pipeline = JSON.parse(pipelineText || "[]")
    return fetcher("/mongodb/api/aggregate", { connStr, db: selectedDb, collection: selectedColl, pipeline, limit })
  }

  async function runCommand(commandText: string) {
    const cmd = JSON.parse(commandText || "{}")
    return fetcher("/mongodb/api/command", { connStr, db: selectedDb, command: cmd })
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
    const fields = Array.from(docs.reduce((s: Set<string>, d: any) => (Object.keys(d).forEach((k) => s.add(k)), s), new Set<string>()))
    const rows = [fields.join(",")]
    for (const d of docs) {
      rows.push(fields.map((f) => JSON.stringify(d[f] ?? "")).join(","))
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
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
        fields.forEach((f, i) => (obj[f] = JSON.parse(parts[i] || '""')))
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
      ; (window as any).__mongoJumpToDoc = (id: string) => window.dispatchEvent(new CustomEvent("ai-jump-to-doc", { detail: { id } }))
    return () => {
      window.removeEventListener("ai-jump-to-doc", handler as EventListener)
      try {
        delete (window as any).__mongoJumpToDoc
      } catch { }
    }
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
    const offImport = registerAction("mongo.open-import", () => window.dispatchEvent(new CustomEvent("shortcut:mongo.open-import")))
    const offExport = registerAction("mongo.open-export", () => window.dispatchEvent(new CustomEvent("shortcut:mongo.open-export")))
    const offBulk = registerAction("mongo.toggle-bulk", () => window.dispatchEvent(new CustomEvent("shortcut:mongo.toggle-bulk")))
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

  // prettier-ignore
  const viewOptions = [
    ["Connections", "connections"], ["Query", "queryBuilder"], ["Results", "results"],
    ["Details", "details"], ["Bulk", "bulkOps"], ["AI", "ai"]
  ]

  return (
    <main className="min-h-screen bg-background flex flex-col overflow-hidden">
      <ShortcutSettingsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <header
        className={cn(
          "bg-card border-b shrink-0 z-20",
          isHeaderPinned && "sticky top-0",
        )}
      >
        <div className="mx-auto max-w-none px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-pretty truncate">MongoDB Manager</h1>
              <p className="text-xs text-muted-foreground truncate">
                Advanced management with bulk edit, import/export, and command console.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <WithShortcutTooltip actionId="shortcuts.open-settings" label="Shortcuts">
                <button
                  aria-label="Open keyboard shortcuts"
                  onClick={() => setShortcutsOpen(true)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted inline-flex items-center gap-1"
                >
                  <Keyboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Shortcuts</span>
                </button>
              </WithShortcutTooltip>
              <a href="/" className="text-xs underline hover:opacity-80" title="Go to Redis Tester">
                Redis Tester
              </a>
              <button
                onClick={() => setIsHeaderToolsVisible((v) => !v)}
                className="rounded-md border p-1.5 text-xs hover:bg-muted"
                title={isHeaderToolsVisible ? "Hide Tools" : "Show Tools"}
              >
                {isHeaderToolsVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsHeaderPinned((v) => !v)}
                className={cn("rounded-md border p-1.5 text-xs hover:bg-muted", isHeaderPinned && "bg-primary/10 text-primary")}
                title={isHeaderPinned ? "Unpin Header" : "Pin Header"}
              >
                {isHeaderPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isHeaderToolsVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <ConnectionsManager
                    current={connStr}
                    onConnStrChange={handleConnectionChange}
                    remember={remember}
                    onRememberChange={setRemember}
                  />
                  <div>
                    <p className="text-sm font-medium mb-2">View Controls</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {viewOptions.map(([label, key]) => (
                        <label
                          key={key}
                          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 bg-background hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={(view as any)[key]}
                            onChange={(e) => setView((v) => ({ ...v, [key]: e.target.checked }) as any)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                      <button
                        className="ml-2 rounded-md border px-2.5 py-1.5 hover:bg-muted text-xs"
                        onClick={() =>
                          setView({
                            connections: true, queryBuilder: true, results: true, details: true,
                            bulkOps: true, console: true, ai: true
                          })
                        }
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border bg-background text-card-foreground p-3">
                  <p className="text-sm font-medium">Security & Privacy</p>
                  <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Your connection string is never stored or logged by the app. Operations are stateless.</li>
                    <li>Your data streams directly between your browser and your database.</li>
                    <li>For production, use least-privilege users and consider read-only roles where possible.</li>
                  </ul>
                  <PurgeBrowserData />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <DesktopHint />

      <div className="flex-1 min-h-0">
        <div className={isMobile ? "flex flex-col" : "flex h-full"}>
          {view.connections && (
            <aside
              style={isMobile ? undefined : { width: leftW, minWidth: isSidebarCollapsed ? 56 : 220, maxWidth: 480 }}
              className={isMobile ? "border-b" : "shrink-0"}
            >
              <SidebarTree
                connStr={connStr}
                activeDb={selectedDb}
                activeColl={selectedColl}
                isCollapsed={isSidebarCollapsed}
                onSelectDatabase={setSelectedDb}
                onSelectCollection={handleSelectCollection}
                onSelectDocument={handleSelectDocument}
                onToggleCollapse={() => {
                  const newCollapsedState = !isSidebarCollapsed
                  setIsSidebarCollapsed(newCollapsedState)
                  setLeftW(newCollapsedState ? 56 : 280)
                }}
              />
            </aside>
          )}

          {!isMobile && view.connections && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => { dragRef.current.side = "left" }}
              className="w-1.5 cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
              title="Drag to resize"
            />
          )}

          <section className="flex-1 min-w-0 flex flex-col">
            <DocumentTabs
              tabs={docTabs}
              activeId={activeDocId}
              onActivate={(id) => setActiveDocId(id)}
              onClose={(id) => {
                setDocTabs((t) => t.filter((x) => x.id !== id))
                if (activeDocId === id) setActiveDocId(undefined)
              }}
              className="border-b"
            />
            <div className={cn(
              "flex-1 grid min-h-0",
              view.queryBuilder && view.results ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}>
              {view.queryBuilder && (
                <div className="border-r p-3 flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium">Filter (JSON)</label>
                    <textarea value={filter} onChange={(e) => setFilter(e.target.value)} rows={6} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Projection</label>
                      <textarea value={projection} onChange={(e) => setProjection(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Sort</label>
                      <textarea value={sort} onChange={(e) => setSort(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Limit</label>
                      <input type="number" value={limit} min={1} max={5000} onChange={(e) => setLimit(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Skip</label>
                      <input type="number" value={skip} min={0} onChange={(e) => setSkip(Number(e.target.value))} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 flex-wrap">
                    <WithShortcutTooltip actionId="mongo.run-query" label="Run Find">
                      <button
                        // FIX: Use the new handler
                        onClick={handleRunQuery}
                        disabled={!connStr || !selectedDb || !selectedColl || loadingFind}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                      >
                        {loadingFind ? "Running…" : "Run Find"}
                      </button>
                    </WithShortcutTooltip>
                    <button onClick={downloadJSON} disabled={!findResult?.docs?.length} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60">Export JSON</button>
                    <button onClick={downloadCSV} disabled={!findResult?.docs?.length} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60">Export CSV</button>
                    <div className="ml-auto flex items-center gap-2">
                      <WithShortcutTooltip actionId="mongo.page-prev" label="Prev">
                        <button onClick={prevPage} disabled={!connStr || !selectedDb || !selectedColl || loadingFind || skip <= 0} className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-60">Prev</button>
                      </WithShortcutTooltip>
                      <span className="text-xs text-muted-foreground">Page {page}</span>
                      <WithShortcutTooltip actionId="mongo.page-next" label="Next">
                        <button onClick={nextPage} disabled={!connStr || !selectedDb || !selectedColl || loadingFind || (findResult?.docs?.length ?? 0) < limit} className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-60">Next</button>
                      </WithShortcutTooltip>
                    </div>
                  </div>
                </div>
              )}

              {view.results && (
                <div className="flex flex-col min-h-0 w-full p-3 relative min-w-0">
                  <div className="mb-2 flex items-center gap-2 shrink-0">
                    <div className="relative flex-1">
                      <input value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} placeholder="Search within results (client-side)" className="w-full rounded-md border bg-background pl-8 pr-2 py-1.5 text-sm" />
                      <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button onClick={() => reloadFind()} disabled={!connStr || !selectedDb || !selectedColl || loadingFind} className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-60" title="Refresh results">
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingFind && "animate-spin")} />
                      Refresh
                    </button>
                  </div>
                  {findError && <p className="text-xs text-red-500 break-all mb-2 shrink-0">{String(findError.message || findError)}</p>}
                  <div className="flex-1 min-h-0">
                    <DataGrid docs={filteredDocs} collection={selectedColl} isLoading={loadingFind} onUpdateDoc={handleUpdateDoc} onDeleteDoc={handleDeleteDoc} onDuplicateDoc={handleDuplicateDoc} onBulkDelete={handleBulkDelete} page={Math.floor(skip / limit) + 1} limit={limit} 
                      // FIX: Pass the total document count from the new API call
                      totalDocs={countResult?.count ?? 0}
                      onPageChange={handlePageChange}
 />
                  </div>
                </div>
              )}
            </div>

            {!!activeDocId && connStr && selectedDb && selectedColl && (
              <div className="border-t p-3">
                <DocumentViewer connectionString={connStr} db={selectedDb} collection={selectedColl} id={activeDocId} />
              </div>
            )}
          </section>

          {!isMobile && (view.details || view.bulkOps || view.ai) && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => { dragRef.current.side = "right" }}
              className="w-1.5 cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
              title="Drag to resize"
            />
          )}

          {(view.details || view.bulkOps || view.ai) && (
            <aside
              style={isMobile ? undefined : { width: rightW, minWidth: 280, maxWidth: 640 }}
              className={isMobile ? "border-t p-3 space-y-3" : "shrink-0 p-3 space-y-3 overflow-y-auto"}
            >
              {view.details && <DetailsPanel server={serverInfo} serverLoading={loadingServerInfo} serverError={serverError?.message || serverError} dbStats={dbStats} dbLoading={loadingDbStats} dbError={dbStatsError?.message || dbStatsError} collStats={collStats} collLoading={loadingCollStats} collError={collStatsError?.message || collStatsError} indexes={idxList?.indexes ?? []} indexesLoading={loadingIndexes} indexesError={indexesError?.message || indexesError} />}
              {view.bulkOps && <BulkOps onInsertMany={runInsertMany} onUpdateMany={runUpdateMany} onDeleteMany={runDeleteMany} onImportFile={handleImportFile} disabled={!connStr || !selectedDb || !selectedColl} />}
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
                          if (action.type === "aggregate") await runAggregate(JSON.stringify(action.params?.pipeline ?? []))
                          else if (action.type === "insertMany") await runInsertMany(action.params?.docs ?? [])
                          else if (action.type === "updateMany") await runUpdateMany({ filter: action.params?.filter ?? {}, update: action.params?.update ?? {}, upsert: !!action.params?.upsert })
                          else if (action.type === "deleteMany") await runDeleteMany({ filter: action.params?.filter ?? {} })
                          else if (action.type === "command") await runCommand(JSON.stringify(action.params ?? {}))
                        } catch (e) { console.error("[AI execute] action failed:", e) }
                      }
                    }}
                  />
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <TerminalDock>
        <div ref={cmdRef} className="p-3">
          <CommandConsole onRun={runCommand} disabled={!connStr || !selectedDb} />
        </div>
      </TerminalDock>

      <footer className="bg-muted py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} DishIs Technologies •{" "}
              <a href="https://dishis.tech" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">dishis.tech</a>
            </p>
            <p className="text-xs text-muted-foreground">Use responsibly and only with systems you own or have permission to manage.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}