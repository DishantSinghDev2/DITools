"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Database, Folder, FileText, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

type SidebarTreeProps = {
  className?: string
  connStr?: string
  onSelectDatabase?: (db: string) => void
  onSelectCollection?: (db: string, coll: string) => void
  onSelectDocument?: (db: string, coll: string, id: string) => void
}

type DbItem = {
  name: string
}

type CollItem = {
  name: string
}

type DocId = { _id: string }

const fetcher = async (url: string, body: any) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function SidebarTree({
  className,
  connStr,
  onSelectDatabase,
  onSelectCollection,
  onSelectDocument,
}: SidebarTreeProps) {
  const [activeConn, setActiveConn] = useState<string>("")
  useEffect(() => {
    setActiveConn(connStr ?? activeConn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connStr])

  const [expandedDb, setExpandedDb] = useState<Record<string, boolean>>({})
  const [expandedColl, setExpandedColl] = useState<Record<string, boolean>>({})
  const [activeDb, setActiveDb] = useState<string>("")
  const [activeColl, setActiveColl] = useState<string>("")
  const [activeDoc, setActiveDoc] = useState<string>("")
  const [docSearch, setDocSearch] = useState<string>("")

  const { data: serverInfo, mutate: reloadServer } = useSWR<{ version: string }>(
    activeConn || connStr ? ["/mongodb/api/serverInfo", { connStr: activeConn || connStr }] : null,
    ([url, body]) => fetcher(url, body),
  )

  const { data: dbs, mutate: reloadDbs } = useSWR<{ databases: DbItem[] }>(
    activeConn || connStr ? ["/mongodb/api/databases", { connStr: activeConn || connStr }] : null,
    ([url, body]) => fetcher(url, body),
  )

  const collections = useSWR<{ collections: CollItem[] }>(
    (activeConn || connStr) && activeDb
      ? ["/mongodb/api/collections", { connStr: activeConn || connStr, db: activeDb }]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const docs = useSWR<{ docs?: DocId[]; data?: DocId[] }>(
    (activeConn || connStr) && activeDb && activeColl && expandedColl[`${activeDb}.${activeColl}`]
      ? [
          "/mongodb/api/find",
          {
            connStr: activeConn || connStr,
            db: activeDb,
            coll: activeColl,
            filter: {},
            projection: { _id: 1 },
            limit: 100,
            skip: 0,
          },
        ]
      : null,
    ([url, body]) => fetcher(url, body),
  )

  const docIds = useMemo(() => {
    const list = (docs?.data?.docs || docs?.data?.data || []) as any[]
    return (Array.isArray(list) ? list : [])
      .map((d: any) => {
        const id = d?._id
        if (!id) return null
        if (typeof id === "string") return id
        if (typeof id === "object") {
          if (id.$oid) return id.$oid
          if (id.oid) return id.oid
          if (id.toString) return String(id)
        }
        return null
      })
      .filter(Boolean) as string[]
  }, [docs?.data])

  const host = parseHost(activeConn || connStr)
  const version = serverInfo?.version || "-"

  return (
    <aside className={cn("w-full md:w-72 shrink-0 border-r bg-background", className)} aria-label="Collections Sidebar">
      <div className="flex flex-col">
        <div className="border-b px-3 py-2">
          <div className="text-xs text-muted-foreground">Connected to</div>
          <div className="text-sm font-medium">{host || "(not set)"}</div>
          <div className="text-xs text-muted-foreground">MongoDB {version ? String(version) : "unknown"}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search databases/collections"
                className="w-full rounded-md border bg-background pl-7 pr-2 py-1.5 text-xs"
              />
              <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reloadServer()
                reloadDbs()
              }}
              disabled={!activeConn && !connStr}
              title="Refresh server and databases"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-1">
          <ul className="space-y-0.5">
            {(dbs?.databases || []).map((db) => {
              const isOpen = !!expandedDb[db.name]
              return (
                <div key={db.name}>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
                    onClick={() => {
                      setActiveDb(db.name)
                      setExpandedDb((prev) => ({ ...prev, [db.name]: !prev[db.name] }))
                    }}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Database className="h-4 w-4" />
                    <span className="text-sm">{db.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => reloadDbs()} title="Refresh databases">
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Refresh databases</span>
                    </Button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 mt-1 space-y-1">
                          <div className="flex items-center justify-between pr-2">
                            <span className="text-xs text-muted-foreground">Collections</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => collections.mutate()}
                              title="Refresh collections"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="sr-only">Refresh collections</span>
                            </Button>
                          </div>
                          {(collections.data?.collections || []).map((c) => {
                            const key = `${db.name}.${c.name}`
                            const collOpen = !!expandedColl[key]
                            const selected = activeDb === db.name && activeColl === c.name
                            return (
                              <div key={key}>
                                <div
                                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
                                  onClick={() => {
                                    setActiveColl(c.name)
                                    setExpandedColl((prev) => ({ ...prev, [key]: !prev[key] }))
                                  }}
                                >
                                  {collOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <Folder className="h-4 w-4" />
                                  <span className="text-sm">{c.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => docs.mutate()}
                                    title="Refresh documents"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">Refresh documents</span>
                                  </Button>
                                </div>

                                <AnimatePresence initial={false}>
                                  {collOpen && selected && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="ml-6 mt-1 pr-2 flex items-center gap-2">
                                        <div className="relative flex-1">
                                          <input
                                            value={docSearch}
                                            onChange={(e) => setDocSearch(e.target.value)}
                                            placeholder="Search docs (IDs)"
                                            className="w-full rounded border bg-background pl-7 pr-2 py-1 text-xs"
                                          />
                                          <Search className="h-3.5 w-3.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => docs.mutate()}
                                          title="Refresh documents"
                                        >
                                          <RefreshCw className="h-4 w-4" />
                                          <span className="sr-only">Refresh documents</span>
                                        </Button>
                                      </div>

                                      <div className="ml-6 mt-1 space-y-1">
                                        {docIds.filter((id) => id.toLowerCase().includes(docSearch.toLowerCase()))
                                          .length === 0 ? (
                                          <div className="text-xs text-muted-foreground px-2 py-1">
                                            No docs (first 100){docSearch ? " match your search" : ""}
                                          </div>
                                        ) : (
                                          docIds
                                            .filter((id) => id.toLowerCase().includes(docSearch.toLowerCase()))
                                            .map((id) => (
                                              <button
                                                key={id}
                                                className={cn(
                                                  "w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-muted text-left",
                                                  activeDoc === id && "bg-muted",
                                                )}
                                                onClick={() => {
                                                  setActiveDoc(id)
                                                  onSelectDocument?.(db.name, c.name, id)
                                                  window.dispatchEvent(
                                                    new CustomEvent("mongo:select-doc", {
                                                      detail: { db: db.name, collection: c.name, id },
                                                    }),
                                                  )
                                                }}
                                                title={id}
                                              >
                                                <FileText className="h-3.5 w-3.5" />
                                                <span className="text-xs truncate">{id}</span>
                                              </button>
                                            ))
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </ul>
        </div>
      </div>
    </aside>
  )
}

function parseHost(str: string) {
  if (!str) return ""
  try {
    // crude parse: hide credentials if present; show host(s)
    // mongodb+srv://user:pass@host/db -> host/db
    const at = str.indexOf("@")
    const start = str.indexOf("://")
    if (start !== -1) {
      if (at !== -1) {
        return str.slice(at + 1)
      }
      return str.slice(start + 3)
    }
    return str
  } catch {
    return str
  }
}

export default SidebarTree
