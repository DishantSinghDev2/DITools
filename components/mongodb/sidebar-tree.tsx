// components/mongodb/sidebar-tree.tsx
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronRight, Database, Folder, FileText, RefreshCw, Search, PanelLeftClose, PanelLeftOpen, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

// --- Enhanced Type Definitions ---
type DbItem = { name: string }
type CollItem = { name: string }
type MongoID = string | { $oid: string } | object
type DocItem = { _id: MongoID }

type ApiResponse_Dbs = { databases: string[] | DbItem[] }
type ApiResponse_Colls = { collections: string[] | CollItem[] }
type ApiResponse_Docs = { docs: DocItem[] }

type SidebarTreeProps = {
  connStr: string
  activeDb?: string
  activeColl?: string
  isCollapsed: boolean
  onSelectDatabase: (db: string) => void
  onSelectCollection: (db: string, coll: string) => void
  onSelectDocument: (db: string, coll: string, id: string) => void
  onToggleCollapse: () => void
}

// --- Utility Functions ---
const fetcher = async (url: string, body: object) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || "An error occurred.")
  }
  return res.json()
}

const parseHost = (str: string) => {
  if (!str) return ""
  try {
    const atIndex = str.indexOf("@")
    const protocolIndex = str.indexOf("://")
    if (protocolIndex !== -1) {
      return str.substring(atIndex !== -1 ? atIndex + 1 : protocolIndex + 3)
    }
    return str
  } catch {
    return str
  }
}

const normalizeDocId = (id: MongoID): string => {
  if (typeof id === "string") return id
  if (id && typeof id === "object") {
    if ('$oid' in id && typeof id.$oid === 'string') return id.$oid
    return JSON.stringify(id) // Fallback for complex ObjectIDs
  }
  return String(id)
}

// --- Main Component ---

// --- Main Component ---
export function SidebarTree({
  connStr,
  activeDb,
  activeColl,
  isCollapsed,
  onSelectDatabase,
  onSelectCollection,
  onSelectDocument,
  onToggleCollapse,
}: SidebarTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [filterText, setFilterText] = useState("")

  useEffect(() => {
    if (activeDb) {
      setExpanded(prev => ({ ...prev, [activeDb]: true }))
    }
  }, [activeDb])

  const { data: serverInfo, mutate: reloadServer } = useSWR(
    connStr ? ["/mongodb/api/serverInfo", { connStr }] : null,
    ([url, body]) => fetcher(url, body)
  )

  const { data: dbsResponse, error: dbsError, isLoading: dbsLoading, mutate: reloadDbs } = useSWR<ApiResponse_Dbs>(
    connStr ? ["/mongodb/api/databases", { connStr }] : null,
    ([url, body]) => fetcher(url, body)
  )

  const handleRefresh = useCallback(() => {
    reloadServer()
    reloadDbs()
  }, [reloadServer, reloadDbs])

  const databases = useMemo((): DbItem[] => {
    if (!dbsResponse?.databases) return []
    // Handle both ["db1"] and [{name: "db1"}] formats
    return dbsResponse.databases.map(db => (typeof db === 'string' ? { name: db } : db))
  }, [dbsResponse])

  const filteredDbs = useMemo(() => {
    if (!filterText.trim()) return databases
    const lowercasedFilter = filterText.toLowerCase()
    return databases.filter(db => db.name.toLowerCase().includes(lowercasedFilter))
  }, [databases, filterText])

  const host = parseHost(connStr)
  const version = serverInfo?.version || "N/A"

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 border-r bg-background" aria-label="Collections Sidebar (Collapsed)">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col items-center p-2 space-y-2">
            <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Expand Sidebar">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!connStr} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <hr className="w-full border-border" />
            {databases.map(db => (
              <Tooltip key={db.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeDb === db.name ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => onSelectDatabase(db.name)}
                  >
                    <Database className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{db.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </aside>
    )
  }

  return (
    <aside className="w-full md:w-72 shrink-0 border-r bg-background flex flex-col" aria-label="Collections Sidebar">
      <div className="border-b p-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Connected to</div>
            <div className="text-sm font-medium truncate" title={host}>{host || "(not connected)"}</div>
            <div className="text-xs text-muted-foreground">MongoDB v{version}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Collapse Sidebar" className="shrink-0">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search databases..."
              className="w-full rounded-md border bg-background pl-7 pr-2 py-1 text-sm"
            />
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!connStr} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-1 overflow-y-auto flex-1">
        {dbsLoading && <div className="text-xs text-muted-foreground px-2">Loading databases...</div>}
        {dbsError && <ErrorMessage message={dbsError.message} />}
        {filteredDbs.length > 0 && (
          <ul className="space-y-0.5">
            {filteredDbs.map(db => (
              <DatabaseNode
                key={db.name}
                db={db}
                connStr={connStr}
                isOpen={!!expanded[db.name]}
                isActive={activeDb === db.name}
                activeColl={activeColl}
                onToggle={() => setExpanded(prev => ({ ...prev, [db.name]: !prev[db.name] }))}
                onSelectDatabase={onSelectDatabase}
                onSelectCollection={onSelectCollection}
                onSelectDocument={onSelectDocument}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}


// --- Sub-Components for Tree Nodes ---

function DatabaseNode({ db, connStr, isOpen, isActive, activeColl, onToggle, onSelectDatabase, onSelectCollection, onSelectDocument }) {
  const { data: collsResponse, error, isLoading } = useSWR<ApiResponse_Colls>(
    connStr && db.name && isOpen ? ["/mongodb/api/collections", { connStr, db: db.name }] : null,
    ([url, body]) => fetcher(url, body), { revalidateOnFocus: false }
  )

  const collections = useMemo((): CollItem[] => {
    if (!collsResponse?.collections) return []
    // This is the FIX: Handle both ["coll1"] and [{name: "coll1"}] formats
    return collsResponse.collections.map(coll => 
      typeof coll === 'string' ? { name: coll } : coll
    )
  }, [collsResponse])

  const handleClick = () => {
    onSelectDatabase(db.name)
    onToggle()
  }

  return (
    <li>
      <div
        className={cn("flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer", isActive && "bg-muted")}
        onClick={handleClick}
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Database className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium flex-1 truncate">{db.name}</span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="ml-6 mt-1 space-y-1 pl-1 border-l border-dashed">
              {isLoading && <li className="text-xs text-muted-foreground px-2">Loading...</li>}
              {error && <ErrorMessage message={error.message} isNested />}
              {collections.map(c => (
                <CollectionNode
                  key={c.name}
                  dbName={db.name}
                  coll={c}
                  isActive={isActive && activeColl === c.name}
                  onSelectCollection={onSelectCollection}
                  onSelectDocument={onSelectDocument}
                />
              ))}
              {!isLoading && collections.length === 0 && <li className="text-xs text-muted-foreground px-2 py-1">No collections</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function CollectionNode({ dbName, coll, isActive, onSelectCollection, onSelectDocument }) {
  // IMPORTANT: This node no longer fetches documents. It only triggers the action.
  // The main page is responsible for fetching and displaying documents.
  // We can add back a small document list later if needed for quick navigation.
  
  const handleClick = () => {
    // This is the CORE CHANGE:
    // When a collection is clicked, it immediately calls the onSelectCollection prop.
    // This tells the parent page (MongoManagerPage) to fetch the documents
    // for this collection and display them in the main DataGrid.
    onSelectCollection(dbName, coll.name)
  }

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer",
          isActive && "bg-primary/10 text-primary font-semibold"
        )}
        onClick={handleClick}
      >
        {/* We can remove the chevron as we are not expanding this node anymore */}
        <Folder className="h-4 w-4 text-sky-600 shrink-0" />
        <span className="text-sm flex-1 truncate">{coll.name}</span>
      </div>
    </li>
  )
}

function ErrorMessage({ message, isNested = false }: { message: string; isNested?: boolean }) {
    // ... (Error message component remains the same) ...
}