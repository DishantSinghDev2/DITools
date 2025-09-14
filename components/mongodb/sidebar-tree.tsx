"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ChevronDown,
  ChevronRight,
  Database,
  Folder,
  RefreshCw,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

type DbItem = { name: string }
type CollItem = { name: string }
type ApiResponse<T> = { [key: string]: T[] }

type SidebarTreeProps = {
  connStr: string
  activeDb?: string
  activeColl?: string
  isCollapsed: boolean
  onSelectDatabase: (db: string) => void
  onToggleCollapse: () => void
  onOpenCollectionTab: (db: string, coll: string) => void;
  onShowCreateCollectionDialog: (db: string) => void;
  onShowDropDatabaseDialog: (db: string) => void;
  onDropCollection: (db: string, coll: string) => void;
}

type DatabaseNodeProps = {
  db: DbItem
  connStr: string
  isOpen: boolean
  isActive: boolean
  activeColl?: string
  onToggle: () => void
  onSelectDatabase: (db: string) => void
  onOpenCollectionTab: (db: string, coll: string) => void;
  onShowCreateCollectionDialog: (db: string) => void;
  onShowDropDatabaseDialog: (db: string) => void;
  onDropCollection: (db: string, coll: string) => void;
}

type CollectionNodeProps = {
  dbName: string
  coll: CollItem
  isActive: boolean
  onOpenCollectionTab: (db: string, coll: string) => void;
  onDropCollection: (db: string, coll: string) => void;
}

type ErrorMessageProps = {
  message: string
  isNested?: boolean
}

const fetcher = async <T,>(url: string, body: object): Promise<T> => {
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

const parseHost = (str: string): string => {
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

export function SidebarTree({
  connStr,
  onOpenCollectionTab,
  onShowCreateCollectionDialog,
  onShowDropDatabaseDialog,
  onDropCollection,
  activeDb,
  activeColl,
  isCollapsed,
  onSelectDatabase,
  onToggleCollapse,
}: SidebarTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [filterText, setFilterText] = useState("")

  useEffect(() => {
    if (activeDb) {
      setExpanded((prev) => ({ ...prev, [activeDb]: true }))
    }
  }, [activeDb])

  const { data: serverInfo, mutate: reloadServer, isLoading: serverLoading } = useSWR<{ version: string }>(
    connStr ? ["/mongodb/api/serverInfo", { connStr }] : null,
    ([url, body]) => fetcher<{ version: string }>(url, body),
  )

  const { data: dbsResponse, error: dbsError, isLoading: dbsLoading, mutate: reloadDbs } = useSWR<ApiResponse<DbItem | string>>(
    connStr ? ["/mongodb/api/databases", { connStr }] : null,
    ([url, body]) => fetcher<ApiResponse<DbItem | string>>(url, body),
  )

  const handleRefresh = useCallback(() => {
    if (!connStr) return
    reloadServer()
    reloadDbs()
  }, [connStr, reloadServer, reloadDbs])

  const databases: DbItem[] = useMemo(() => {
    const dbs = dbsResponse?.databases ?? []
    return dbs.map((db) => (typeof db === "string" ? { name: db } : db))
  }, [dbsResponse])

  const filteredDbs = useMemo(() => {
    if (!filterText.trim()) return databases
    const lowercasedFilter = filterText.toLowerCase()
    return databases.filter((db) => db.name.toLowerCase().includes(lowercasedFilter))
  }, [databases, filterText])

  const isLoading = dbsLoading || serverLoading
  const host = parseHost(connStr)
  const version = serverInfo?.version || "..."

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 border-r bg-background h-full">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col items-center p-2 space-y-2">
            <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={!connStr || isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <hr className="w-full border-border" />
            {databases.map((db) => (
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
    <aside className="w-full h-full bg-background flex flex-col">
      <div className="border-b p-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Connected to</div>
            <div className="text-sm font-medium truncate" title={host}>
              {host || "(not connected)"}
            </div>
            <div className="text-xs text-muted-foreground">MongoDB v{version}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
            <PanelLeftClose className="h-5 w-5" />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={!connStr || isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="p-1 overflow-y-auto flex-1">
        {dbsLoading && <div className="text-xs text-muted-foreground px-2 py-1">Loading databases...</div>}
        {dbsError && <ErrorMessage message={dbsError.message} />}
        {!dbsLoading && !dbsError && filteredDbs.length === 0 && (
          <div className="text-xs text-muted-foreground px-2 py-1">No databases found.</div>
        )}
        {filteredDbs.length > 0 && (
          <ul className="space-y-0.5">
            {filteredDbs.map((db) => (
              <DatabaseNode
                key={db.name}
                db={db}
                connStr={connStr}
                isOpen={!!expanded[db.name]}
                isActive={activeDb === db.name}
                activeColl={activeColl}
                onToggle={() => setExpanded((prev) => ({ ...prev, [db.name]: !prev[db.name] }))}
                onSelectDatabase={onSelectDatabase}
                onOpenCollectionTab={onOpenCollectionTab}
                onShowCreateCollectionDialog={onShowCreateCollectionDialog}
                onShowDropDatabaseDialog={onShowDropDatabaseDialog}
                onDropCollection={onDropCollection}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function DatabaseNode({
  db,
  onOpenCollectionTab,
  onShowCreateCollectionDialog,
  onShowDropDatabaseDialog,
  onDropCollection,
  connStr,
  isOpen,
  isActive,
  activeColl,
  onToggle,
  onSelectDatabase,
}: DatabaseNodeProps) {
  const { data: collsResponse, error, isLoading } = useSWR<ApiResponse<CollItem | string>>(
    connStr && db.name && isOpen ? ["/mongodb/api/collections", { connStr, db: db.name }] : null,
    ([url, body]) => fetcher<ApiResponse<CollItem | string>>(url, body),
    { revalidateOnFocus: false },
  )

  const collections: CollItem[] = useMemo(() => {
    const colls = collsResponse?.collections ?? []
    return colls.map((coll) => (typeof coll === "string" ? { name: coll } : coll))
  }, [collsResponse])

  const handleClick = () => {
    onSelectDatabase(db.name)
    onToggle()
  }

  return (
    <li>
      <div className={cn("group flex items-center gap-1.5 px-2 py-1.5 h-8 hover:bg-muted/50 rounded cursor-pointer", isActive && "bg-muted")}
      >
        <button onClick={handleClick} className="flex items-center flex-1 min-w-0 gap-1.5 h-8">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Database className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium flex-1 truncate">{db.name}</span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
            onClick={() => onShowCreateCollectionDialog(db.name)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onShowDropDatabaseDialog(db.name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="ml-6 mt-1 space-y-1 pl-1 border-l border-dashed">
              {isLoading && <li className="text-xs text-muted-foreground px-2 py-1">Loading...</li>}
              {error && <ErrorMessage message={error.message} isNested />}
              {collections.map((c) => (
                <CollectionNode
                  key={c.name}
                  dbName={db.name}
                  coll={c}
                  isActive={isActive && activeColl === c.name}
                  onOpenCollectionTab={onOpenCollectionTab}
                  onDropCollection={onDropCollection}
                />
              ))}
              {!isLoading && collections.length === 0 && (
                <li className="text-xs text-muted-foreground px-2 py-1">No collections</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function CollectionNode({ dbName, coll, isActive, onOpenCollectionTab, onDropCollection }: CollectionNodeProps) {
  return (
    <li>
      <div className={cn("group flex items-center gap-1.5 pr-1 pl-2 py-1 h-8 hover:bg-muted/50 rounded", isActive && "bg-primary/10")}
      >
        <button onClick={() => onOpenCollectionTab(dbName, coll.name)} className="flex items-center flex-1 min-w-0 gap-1.5 h-8">
          <Folder className="h-4 w-4 text-sky-600 shrink-0" />
          <span className={cn("text-sm flex-1 truncate text-left", isActive && "text-primary font-semibold")}>{coll.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-[160px]">
            <DropdownMenuItem onClick={() => onOpenCollectionTab(dbName, coll.name)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Tab
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500" onClick={() => onDropCollection(dbName, coll.name)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Drop Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function ErrorMessage({ message, isNested = false }: ErrorMessageProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-red-500 p-2", isNested ? "ml-2" : "bg-red-500/10 rounded-md")}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="break-all">{message}</span>
    </div>
  )
}