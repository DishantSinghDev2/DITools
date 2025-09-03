"use client"

import { useState } from "react"

export type BulkOpsProps = {
  onInsertMany: (docs: any[]) => Promise<void>
  onUpdateMany: (payload: { filter: any; update: any; upsert?: boolean }) => Promise<void>
  onDeleteMany: (payload: { filter: any }) => Promise<void>
  onImportFile: (file: File) => Promise<void>
  disabled: boolean
}

export function BulkOps({ onInsertMany, onUpdateMany, onDeleteMany, onImportFile, disabled }: BulkOpsProps) {
  const [insertText, setInsertText] = useState('[\n  { "name": "Alice" }\n]')
  const [updateFilter, setUpdateFilter] = useState("{ }")
  const [updateDoc, setUpdateDoc] = useState('{ "$set": { "active": true } }')
  const [upsert, setUpsert] = useState(false)
  const [deleteFilter, setDeleteFilter] = useState("{ }")

  async function handleFileChange(file?: File | null) {
    if (!file) return
    await onImportFile(file)
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <h3 className="font-medium text-sm">Bulk Operations</h3>

      {/* InsertMany */}
      <div className="space-y-2">
        <label className="text-xs font-medium">InsertMany (JSON array)</label>
        <textarea
          value={insertText}
          onChange={(e) => setInsertText(e.target.value)}
          rows={4}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
        />
        <div className="flex items-center gap-2">
          <button
            disabled={disabled}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
            onClick={async () => {
              const parsed = JSON.parse(insertText || "[]")
              const docs = Array.isArray(parsed) ? parsed : [parsed]
              await onInsertMany(docs)
            }}
          >
            Insert Many
          </button>
          <input
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            disabled={disabled}
            className="text-xs"
          />
        </div>
      </div>

      {/* UpdateMany */}
      <div className="space-y-2">
        <label className="text-xs font-medium">UpdateMany</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground">Filter</span>
            <textarea
              value={updateFilter}
              onChange={(e) => setUpdateFilter(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
            />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Update</span>
            <textarea
              value={updateDoc}
              onChange={(e) => setUpdateDoc(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="upsert" type="checkbox" checked={upsert} onChange={(e) => setUpsert(e.target.checked)} />
          <label htmlFor="upsert" className="text-xs">
            Upsert
          </label>
          <button
            disabled={disabled}
            className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
            onClick={async () => {
              const payload = {
                filter: JSON.parse(updateFilter || "{}"),
                update: JSON.parse(updateDoc || "{}"),
                upsert,
              }
              await onUpdateMany(payload)
            }}
          >
            Update Many
          </button>
        </div>
      </div>

      {/* DeleteMany */}
      <div className="space-y-2">
        <label className="text-xs font-medium">DeleteMany</label>
        <textarea
          value={deleteFilter}
          onChange={(e) => setDeleteFilter(e.target.value)}
          rows={3}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
        />
        <button
          disabled={disabled}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
          onClick={async () => {
            await onDeleteMany({ filter: JSON.parse(deleteFilter || "{}") })
          }}
        >
          Delete Many
        </button>
      </div>
    </div>
  )
}
