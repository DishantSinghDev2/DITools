"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR, { mutate } from "swr"
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
import { Keyboard, RefreshCw, Search, ChevronUp, ChevronDown, Pin, PinOff, Filter, Terminal } from "lucide-react"
import { SidebarTree } from "@/components/mongodb/sidebar-tree"
import { CollectionTabs, type CollectionTab } from "@/components/mongodb/collection-tabs"
import { DocumentViewer } from "@/components/mongodb/document-viewer"
import { TerminalDock } from "@/components/mongodb/terminal-dock"
import { ShortcutSettingsDialog } from "@/components/settings/shortcut-settings-dialog"
import { cn } from "@/lib/utils"
import { arrayMove } from "@dnd-kit/sortable"


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"


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
  const [filter, setFilter] = useState("{ }")
  const [projection, setProjection] = useState("{ }")
  const [sort, setSort] = useState("{ }")
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(20)

  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [quickSearch, setQuickSearch] = useState("")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [leftW, setLeftW] = useState(280)

  const [collectionTabs, setCollectionTabs] = useState<CollectionTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | undefined>(undefined)

  const [createCollDialog, setCreateCollDialog] = useState({ open: false, db: "" });
  const [newCollName, setNewCollName] = useState("");
  const [dropDbDialog, setDropDbDialog] = useState({ open: false, db: "" });
  const [confirmDbName, setConfirmDbName] = useState("");

  const activeCollection = useMemo(
    () => collectionTabs.find(t => t.id === activeTabId),
    [collectionTabs, activeTabId]
  );
    
  // DERIVED STATE: The single source of truth for the active DB and Collection
  const activeDb = activeCollection?.db;
  const activeColl = activeCollection?.collection;

  const [rightW, setRightW] = useState(360)
  const dragRef = useRef<{ side: "left" | "right" | null }>({ side: null })
  const isMobile = useMobile()

  const [isHeaderToolsVisible, setIsHeaderToolsVisible] = useState(true)
  const [isHeaderPinned, setIsHeaderPinned] = useState(false)
  const [isQueryBuilderOpen, setIsQueryBuilderOpen] = useState(false);


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


  const { mutate: reloadDbs } = useSWR(connStr ? ["/mongodb/api/databases", { connStr }] : null, ([url, body]) => fetcher(url, body))

  const { data: countResult, mutate: reloadCount } = useSWR(
    connStr && activeDb && activeColl
      ? ["/mongodb/api/count", { connStr, db: activeDb, coll: activeColl, filter: query.filter }]
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
    connStr && activeDb && activeColl
      ? ["/mongodb/api/collStats", { connStr, db: activeDb, collection: activeColl }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const { data: idxList, isLoading: loadingIndexes, error: indexesError } = useSWR(
    connStr && activeDb && activeColl
      ? ["/mongodb/api/indexes/list", { connStr, db: activeDb, collection: activeColl }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const {
    data: findResult,
    isLoading: loadingFind,
    mutate: reloadFind,
    error: findError,
  } = useSWR(
    connStr && activeDb && activeColl
      ? ["/mongodb/api/find", {
        connStr,
        db: activeDb,
        coll: activeColl,
        ...query,
        limit,
        skip
      }]
      : null,
    ([url, body]) => fetcher(url, body),
    { revalidateOnFocus: false }
  )

  async function runInsertMany(docs: any[]) {
      if (!activeDb || !activeColl) return;
    const res = await fetcher("/mongodb/api/insertMany", { connStr, db: activeDb, collection: activeColl, docs })
    try {
      const ids = res?.insertedIds
      if (ids) {
        const first = Array.isArray(ids) ? ids[0] : typeof ids === "object" ? Object.values(ids)[0] : null
        if (first) setHighlightId(String(first))
      }
    } catch { }
    await reloadFind()
  }

  const handleReorderTabs = (activeId: string, overId: string) => {
    setCollectionTabs((tabs) => {
      const oldIndex = tabs.findIndex((t) => t.id === activeId)
      const newIndex = tabs.findIndex((t) => t.id === overId)

      if (tabs[oldIndex].isPinned !== tabs[newIndex].isPinned) {
        return tabs;
      }

      return arrayMove(tabs, oldIndex, newIndex)
    })
  }

  const handleOpenCollectionTab = (db: string, coll: string) => {
    const tabId = `${db}:${coll}`;
    if (!collectionTabs.some(t => t.id === tabId)) {
      setCollectionTabs(prev => [...prev, { id: tabId, db, collection: coll, isPinned: false }]);
    }
    setActiveTabId(tabId);
    setSelectedDb(db); // Keep sidebar selection in sync
  }

  const handleCloseTab = (tabId: string) => {
    const tabIndex = collectionTabs.findIndex(t => t.id === tabId);
    setCollectionTabs(prev => prev.filter(t => t.id !== tabId));

    if (activeTabId === tabId) {
      const nextTab = collectionTabs[tabIndex - 1] || collectionTabs[tabIndex + 1];
      setActiveTabId(nextTab?.id);
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollName || !createCollDialog.db) return;
    try {
      await fetcher("/mongodb/api/collections/create", {
        connStr,
        db: createCollDialog.db,
        name: newCollName
      });
      mutate(["/mongodb/api/collections", { connStr, db: createCollDialog.db }]); // More specific mutation
      setCreateCollDialog({ open: false, db: "" });
      setNewCollName("");
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  }

  const handleDropDatabase = async () => {
    if (confirmDbName !== dropDbDialog.db) return;
    try {
      await fetcher("/mongodb/api/databases/drop", { connStr, db: dropDbDialog.db });
      mutate(["/mongodb/api/databases", { connStr }]);
      // Close any open tabs from the dropped DB
      setCollectionTabs(tabs => tabs.filter(t => t.db !== dropDbDialog.db));
      if (activeDb === dropDbDialog.db) {
          setActiveTabId(undefined);
      }
      setDropDbDialog({ open: false, db: "" });
      setConfirmDbName("");
    } catch (error) {
      console.error("Failed to drop database:", error);
    }
  }

  const handleDropCollection = async (db: string, coll: string) => {
    if (confirm(`Are you sure you want to drop the collection "${coll}"?`)) {
      try {
        await fetcher("/mongodb/api/collections/drop", { connStr, db, coll });
        mutate(["/mongodb/api/collections", { connStr, db }]);
        handleCloseTab(`${db}:${coll}`);
      } catch (error) {
        console.error("Failed to drop collection", error);
      }
    }
  }

  const handlePinTab = (tabId: string) => {
    setCollectionTabs(tabs => {
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return tabs;

      const tabToUpdate = { ...tabs[tabIndex] };
      const isNowPinned = !tabToUpdate.isPinned;
      tabToUpdate.isPinned = isNowPinned;

      const newTabs = [...tabs];
      newTabs.splice(tabIndex, 1);

      if (isNowPinned) {
        const lastPinnedIndex = newTabs.findLastIndex(t => t.isPinned);
        newTabs.splice(lastPinnedIndex + 1, 0, tabToUpdate);
      } else {
        const firstUnpinnedIndex = newTabs.findIndex(t => !t.isPinned);
        if (firstUnpinnedIndex === -1) {
          newTabs.push(tabToUpdate);
        } else {
          newTabs.splice(firstUnpinnedIndex, 0, tabToUpdate);
        }
      }

      return newTabs;
    })
  }

  async function runUpdateMany(payload: { filter: any; update: any; upsert?: boolean }) {
      if (!activeDb || !activeColl) return;
    await fetcher("/mongodb/api/updateMany", { connStr, db: activeDb, collection: activeColl, ...payload })
    await reloadFind()
  }

  async function runDeleteMany(payload: { filter: any }) {
      if (!activeDb || !activeColl) return;
    await fetcher("/mongodb/api/deleteMany", { connStr, db: activeDb, collection: activeColl, ...payload })
    await reloadFind()
  }

  async function handleUpdateDoc(id: any, update: object) {
      if (!activeDb || !activeColl) return;
    await fetcher("/mongodb/api/updateOne", { connStr, db: activeDb, collection: activeColl, filter: { _id: id }, update })
    reloadFind()
  }

  async function handleDeleteDoc(id: any) {
      if (!activeDb || !activeColl) return;
    await fetcher("/mongodb/api/deleteOne", { connStr, db: activeDb, collection: activeColl, filter: { _id: id } })
    reloadFind()
    reloadCount()
  }

  async function handleDuplicateDoc(doc: object) {
      if (!activeDb || !activeColl) return;
    const { _id, ...insertDoc } = doc
    await fetcher("/mongodb/api/insertOne", { connStr, db: activeDb, collection: activeColl, doc: insertDoc })
    reloadFind()
    reloadCount()
  }

  async function handleBulkDelete(ids: any[]) {
      if (!activeDb || !activeColl) return;
    await fetcher("/mongodb/api/deleteMany", {
      connStr,
      db: activeDb,
      collection: activeColl,
      filter: { _id: { $in: ids } },
    })
    reloadFind()
    reloadCount()
  }

  const handleRunQuery = () => {
    setSkip(0)
    reloadFind()
    reloadCount()
  }

  const handlePageChange = (newPage: number) => {
    setSkip((newPage - 1) * limit)
  }

  function handleConnectionChange(newConnStr: string) {
    if (newConnStr !== connStr) {
      setConnStr(newConnStr)
      setSelectedDb("")
      setCollectionTabs([]);
      setActiveTabId(undefined);
      setSkip(0)
      reloadDbs()
    }
  }

  async function runAggregate(pipelineText: string) {
      if (!activeDb || !activeColl) return;
    const pipeline = JSON.parse(pipelineText || "[]")
    return fetcher("/mongodb/api/aggregate", { connStr, db: activeDb, collection: activeColl, pipeline, limit })
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
    a.download = `${activeDb}-${activeColl}.json`
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
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeDb}-${activeColl}.csv`
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
        fields.forEach((f, i) => (obj[f] = JSON.parse(parts[i] || '""')))
        return obj
      })
    }
    if (docs.length) await runInsertMany(docs)
  }

  const { registerAction } = useShortcuts()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement | null>(null)
  const cmdRef = useRef<HTMLDivElement | null>(null)

  const [view, setView] = useState({
    connections: true,
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
      if (!connStr || !activeDb || !activeColl || loadingFind) return
      reloadFind()
    })
    const offNext = registerAction("mongo.page-next", () => setSkip(s => s + limit))
    const offPrev = registerAction("mongo.page-prev", () => setSkip(s => Math.max(0, s - limit)))
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
  }, [registerAction, connStr, activeDb, activeColl, loadingFind, limit])


  const filteredDocs = useMemo(() => {
    const docs = findResult?.docs ?? []
    const q = quickSearch.trim().toLowerCase()
    if (!q) return docs
    return docs.filter((d: any) => JSON.stringify(d).toLowerCase().includes(q))
  }, [findResult?.docs, quickSearch])

  const viewOptions = [
    ["Sidebar", "connections"], ["Results", "results"],
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
            >              <div className="border-t p-4 space-y-4">
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
                            connections: true, results: true, details: true,
                            bulkOps: true, console: true, ai: true, queryBuilder: true
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
                activeColl={activeColl}
                isCollapsed={isSidebarCollapsed}
                onSelectDatabase={setSelectedDb}
                onToggleCollapse={() => {
                  const newCollapsedState = !isSidebarCollapsed
                  setIsSidebarCollapsed(newCollapsedState)
                  setLeftW(newCollapsedState ? 56 : 280)
                }}
                onOpenCollectionTab={handleOpenCollectionTab}
                onShowCreateCollectionDialog={(db) => setCreateCollDialog({ open: true, db })}
                onShowDropDatabaseDialog={(db) => setDropDbDialog({ open: true, db })}
                onDropCollection={handleDropCollection}

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
            <CollectionTabs
              tabs={collectionTabs}
              activeId={activeTabId}
              onActivate={setActiveTabId}
              onClose={handleCloseTab}
              onReorder={handleReorderTabs}
              onPin={handlePinTab}
            />

            <div className="flex-1 min-h-0">
              {view.results && (
                <div className="flex flex-col h-full w-full p-3 relative min-w-0">
                  <div className="mb-2 flex items-center gap-2 shrink-0">
                    <div className="relative flex-1">
                      <input value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} placeholder="Search within results (client-side)" className="w-full rounded-md border bg-background pl-8 pr-2 py-1.5 text-sm" />
                      <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>

                    <Dialog open={isQueryBuilderOpen} onOpenChange={setIsQueryBuilderOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
                          <Filter className="h-4 w-4" />
                          Filter & Sort
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Query Builder</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div>
                            <label className="text-sm font-medium">Filter (JSON)</label>
                            <textarea value={filter} onChange={(e) => setFilter(e.target.value)} rows={8} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Projection</label>
                              <textarea value={projection} onChange={(e) => setProjection(e.target.value)} rows={3} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Sort</label>
                              <textarea value={sort} onChange={(e) => setSort(e.target.value)} rows={3} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Limit</label>
                              <input type="number" value={limit} min={1} max={5000} onChange={(e) => setLimit(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Skip</label>
                              <input type="number" value={skip} min={0} onChange={(e) => setSkip(Number(e.target.value))} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm" />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <div className="w-full flex items-center justify-between">
                            <div>
                              <Button variant="ghost" onClick={downloadJSON} disabled={!findResult?.docs?.length}>Export JSON</Button>
                              <Button variant="ghost" onClick={downloadCSV} disabled={!findResult?.docs?.length}>Export CSV</Button>
                            </div>
                            <Button
                              onClick={handleRunQuery}
                              disabled={!connStr || !activeDb || !activeColl || loadingFind}
                            >
                              {loadingFind ? "Running…" : "Run Find"}
                            </Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <button onClick={() => reloadFind()} disabled={!connStr || !activeDb || !activeColl || loadingFind} className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-60" title="Refresh results">
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingFind && "animate-spin")} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>

                  {findError && <p className="text-xs text-red-500 break-all mb-2 shrink-0">{String(findError.message || findError)}</p>}

                    {activeTabId ? (
                         <div className="flex-1 min-h-0">
                    <DataGrid
                      key={activeTabId}
                      docs={filteredDocs}
                      collection={activeColl!}
                      isLoading={loadingFind}
                      onUpdateDoc={handleUpdateDoc}
                      onDeleteDoc={handleDeleteDoc}
                      onDuplicateDoc={handleDuplicateDoc}
                      onBulkDelete={handleBulkDelete}
                      page={Math.floor(skip / limit) + 1}
                      limit={limit}
                      totalDocs={countResult?.count ?? 0}
                      onPageChange={handlePageChange}
                    />
                  </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Select a collection from the sidebar to begin.
                        </div>
                    )}
                </div>
                
              )}
            </div>

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
              {view.bulkOps && <BulkOps onInsertMany={runInsertMany} onUpdateMany={runUpdateMany} onDeleteMany={runDeleteMany} onImportFile={handleImportFile} disabled={!connStr || !activeDb || !activeColl} />}
              {view.ai && (
                <div ref={aiRef} id="ai-panel">
                  <AIAssistant
                    connStrPresent={!!connStr}
                    selectedDb={activeDb}
                    selectedColl={activeColl}
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
          <CommandConsole onRun={runCommand} selectedDB={selectedDb} disabled={!connStr || !selectedDb} />
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
  
      <Dialog open={createCollDialog.open} onOpenChange={(open) => setCreateCollDialog({ ...createCollDialog, open })}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Collection in '{createCollDialog.db}'</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="coll-name">Collection Name</Label>
                <Input id="coll-name" value={newCollName} onChange={(e) => setNewCollName(e.target.value)} placeholder="e.g., users, products" />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setCreateCollDialog({ open: false, db: "" })}>Cancel</Button>
                <Button onClick={handleCreateCollection} disabled={!newCollName}>Create</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dropDbDialog.open} onOpenChange={(open) => setDropDbDialog({ ...dropDbDialog, open })}>
          <DialogContent>
              <DialogHeader><DialogTitle>Drop Database</DialogTitle></DialogHeader>
              <div className="py-4 space-y-4">
                  <Alert variant="destructive">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>This action is irreversible!</AlertTitle>
                      <AlertDescription>
                          You are about to delete the entire database <strong>{dropDbDialog.db}</strong>, including all of its collections, documents, and indexes.
                      </AlertDescription>
                  </Alert>
                  <Label>To confirm, please type the name of the database:</Label>
                  <Input value={confirmDbName} onChange={(e) => setConfirmDbName(e.target.value)} placeholder={dropDbDialog.db} />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setDropDbDialog({ open: false, db: "" })}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDropDatabase} disabled={confirmDbName !== dropDbDialog.db}>Drop Database</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </main>
  )
}