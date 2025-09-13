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
import { v4 as uuidv4 } from "uuid"

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
    const proto = uri.startsWith("mongodb+srv://")
      ? "mongodb+srv://"
      : uri.startsWith("mongodb://")
      ? "mongodb://"
      : ""
    const host = u.host
    return `${proto}${host}${u.pathname === "/" ? "" : u.pathname}${u.search}`
  } catch {
    return uri
  }
}

function isValidMongoUrl(uri: string) {
  try {
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) return false
    new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"))
    return true
  } catch {
    return false
  }
}

export function ConnectionsManager({
  current,
  onConnStrChange,
}: {
  current: string
  onConnStrChange: (connStr: string) => void
}) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [connStr, setConnStr] = useState(current)
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => setConnStr(current), [current])

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
    if (!name.trim() || !isValidMongoUrl(connStr)) return
    const id = uuidv4()
    setProfiles((prev) => [...prev, { id, name: name.trim(), connStr, createdAt: Date.now() }])
    setName("")
  }

  function removeProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }

  function handleConnect() {
    if (!isValidMongoUrl(connStr)) return alert("Invalid MongoDB connection string")
    onConnStrChange(connStr)
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
          <DialogDescription>Enter a MongoDB URI or select a saved profile.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="conn-str">Connection String</Label>
          <Input
            id="conn-str"
            type="text"
            value={connStr}
            onChange={(e) => setConnStr(e.target.value)}
            placeholder="mongodb+srv://user:pass@host/"
          />
        </div>

        <div className="space-y-3 pt-4">
          <h4 className="font-medium text-sm">Saved Profiles</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Profile name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button size="sm" onClick={saveProfile} disabled={!name.trim() || !isValidMongoUrl(connStr)}>
              Save
            </Button>
          </div>

          <div className="space-y-1 max-h-40 overflow-auto">
            {profiles.length === 0 && (
              <p className="text-xs text-muted-foreground">No saved profiles.</p>
            )}
            {profiles.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "rounded border p-2 text-xs flex items-center gap-2",
                  activeId === p.id ? "border-primary" : "border-border"
                )}
              >
                <div className="min-w-0 flex-1 max-w-56">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-muted-foreground truncate">{maskConnStr(p.connStr)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setConnStr(p.connStr)}>
                  Load
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeProfile(p.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConnect} disabled={!isValidMongoUrl(connStr)}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
