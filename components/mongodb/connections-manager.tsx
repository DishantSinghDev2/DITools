"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

type Profile = {
  id: string
  name: string
  connStr: string // stored only if user chooses to save
  createdAt: number
}

const LS_KEY = "mongo-manager:profiles"

function maskConnStr(uri: string) {
  try {
    const u = new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"))
    const user = u.username ? "***" : ""
    const pass = u.password ? "***" : ""
    const proto = uri.startsWith("mongodb+srv://") ? "mongodb+srv://" : uri.startsWith("mongodb://") ? "mongodb://" : ""
    const auth = u.username || u.password ? `${user}:${pass}@` : ""
    const host = u.host
    const path = u.pathname === "/" ? "" : u.pathname
    const search = u.search
    return `${proto}${auth}${host}${path}${search}`
  } catch {
    // fallback: hide credentials substrings if any
    return uri.replace(/:\/\/([^@]+)@/g, "://***:***@")
  }
}

export function ConnectionsManager({
  current,
  onSelect,
}: {
  current: string
  onSelect: (connStr: string) => void
}) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [name, setName] = useState("")
  const [toSave, setToSave] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setProfiles(JSON.parse(raw))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(profiles))
    } catch {}
  }, [profiles])

  const activeId = useMemo(() => {
    const idx = profiles.findIndex((p) => p.connStr === current && current.length > 0)
    return idx >= 0 ? profiles[idx].id : ""
  }, [profiles, current])

  function saveProfile() {
    if (!name.trim()) return
    const id = crypto.randomUUID()
    const connStr = toSave ? current : "" // store connection string only if toggled; name is still saved
    setProfiles((prev) => [...prev, { id, name: name.trim(), connStr, createdAt: Date.now() }])
    setName("")
    setToSave(false)
  }

  function removeProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }

  function loadProfile(p: Profile) {
    if (!p.connStr) return // user didn’t store secrets
    onSelect(p.connStr)
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Connections</h3>
      </div>

      {/* Add new profile */}
      <div className="space-y-2">
        <input
          placeholder="Name this connection (e.g. Prod Cluster)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2">
          <input id="save-secret" type="checkbox" checked={toSave} onChange={(e) => setToSave(e.target.checked)} />
          <label htmlFor="save-secret" className="text-xs text-muted-foreground">
            Store connection string in this browser (never on our servers)
          </label>
          <button
            className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
            onClick={saveProfile}
            disabled={!name.trim()}
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* List profiles */}
      <div className="space-y-1 max-h-48 overflow-auto">
        {profiles.length === 0 && <p className="text-xs text-muted-foreground">No saved profiles yet.</p>}
        {profiles.map((p) => (
          <div
            key={p.id}
            className={cn(
              "rounded border p-2 text-xs flex items-center gap-2",
              activeId === p.id ? "border-primary" : "border-border",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-muted-foreground truncate">{p.connStr ? maskConnStr(p.connStr) : "conn not stored"}</p>
            </div>
            <button
              className="rounded border px-2 py-1 hover:bg-muted disabled:opacity-60"
              title={p.connStr ? "Load into current connection field" : "This profile does not store the connection"}
              onClick={() => loadProfile(p)}
              disabled={!p.connStr}
            >
              Use
            </button>
            <button className="rounded border px-2 py-1 hover:bg-muted" onClick={() => removeProfile(p.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Export / Import */}
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          onClick={() => {
            const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "mongo-connections.json"
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Export
        </button>
        <label className="text-xs">
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const text = await file.text()
              try {
                const imported = JSON.parse(text) as Profile[]
                if (Array.isArray(imported)) setProfiles(imported)
              } catch {}
            }}
          />
          <span className="cursor-pointer underline">Import</span>
        </label>
      </div>
    </div>
  )
}
