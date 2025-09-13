"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid';


type Profile = {
  id: string
  name: string
  connStr: string
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
    return uri.replace(/:\/\/([^@]+)@/g, "://***:***@")
  }
}

export function ConnectionsManager({
  current,
  onConnStrChange,
  remember,
  onRememberChange,
}: {
  current: string
  onConnStrChange: (connStr: string) => void
  remember: boolean
  onRememberChange: (remember: boolean) => void
}) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [name, setName] = useState("")
  const [toSave, setToSave] = useState(true)
  const [open, setOpen] = useState(false)
  const [dialogConnStr, setDialogConnStr] = useState(current)

  useEffect(() => {
    setDialogConnStr(current)
  }, [current])

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
    if (!name.trim() || !dialogConnStr.trim()) return
    const id = uuidv4()
    const connStr = toSave ? dialogConnStr : ""
    setProfiles((prev) => [...prev, { id, name: name.trim(), connStr, createdAt: Date.now() }])
    setName("")
  }

  function removeProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }

  function loadProfile(p: Profile) {
    if (!p.connStr) return
    setDialogConnStr(p.connStr)
  }

  function handleConnect() {
    onConnStrChange(dialogConnStr)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
          <div className="truncate min-w-0">
            <p className="text-xs font-medium">Connection</p>
            <p className="text-xs text-muted-foreground truncate">
              {current ? maskConnStr(current) : "Not Connected"}
            </p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Connection</DialogTitle>
          <DialogDescription>Enter a connection string or choose a saved profile.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="conn-str">Connection String</Label>
          <Input
            id="conn-str"
            type="password"
            value={dialogConnStr}
            onChange={(e) => setDialogConnStr(e.target.value)}
            placeholder="mongodb+srv://user:pass@host/"
          />
          <div className="flex items-center gap-2">
            <input
              id="remember-dialog"
              type="checkbox"
              checked={remember}
              onChange={(e) => onRememberChange(e.target.checked)}
            />
            <Label htmlFor="remember-dialog" className="text-xs font-normal text-muted-foreground">
              Remember in this browser
            </Label>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h4 className="font-medium text-sm">Connection Profiles</h4>
          <div className="space-y-2">
            <Input placeholder="Name current connection to save it" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex items-center gap-2">
              <input id="save-secret" type="checkbox" checked={toSave} onChange={(e) => setToSave(e.target.checked)} />
              <Label htmlFor="save-secret" className="text-xs font-normal text-muted-foreground">
                Store connection string
              </Label>
              <Button className="ml-auto" size="sm" onClick={saveProfile} disabled={!name.trim() || !dialogConnStr.trim()}>
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-1 max-h-40 overflow-auto">
            {profiles.length === 0 && <p className="text-xs text-muted-foreground">No saved profiles yet.</p>}
            {profiles.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "rounded border p-2 text-xs flex items-center gap-2",
                  activeId === p.id ? "border-primary" : "border-border",
                )}
              >
                <div className="min-w-0 flex-1 max-w-56">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-muted-foreground truncate">{p.connStr ? maskConnStr(p.connStr) : "Not stored"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => loadProfile(p)} disabled={!p.connStr}>
                  Load
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeProfile(p.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <div>
            <Button
              variant="secondary"
              size="sm"
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
            </Button>
            <Label className="text-sm ml-2">
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
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleConnect} disabled={!dialogConnStr}>
              Connect
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}