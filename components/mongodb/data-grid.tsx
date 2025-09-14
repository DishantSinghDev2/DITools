// components/mongodb/data-grid.tsx
"use client"

import { useState } from "react"
import { DataGridToolbar } from "./data-grid-toolbar"
import { JsonView } from "./views/json-view"
import { TableView } from "./views/table-view"
import { ListView } from "./views/list-view"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export type ViewMode = "json" | "table" | "list"
export type MongoDoc = { _id: any; [key: string]: any }

export interface DataGridProps {
  docs: MongoDoc[]
  collection: string
  isLoading: boolean
  onUpdateDoc: (id: any, update: object) => Promise<void>
  onDeleteDoc: (id: any) => Promise<void>
  onDuplicateDoc: (doc: MongoDoc) => Promise<void>
  onBulkDelete: (ids: any[]) => Promise<void>
  page: number
  limit: number
  totalDocs: number
  onPageChange: (page: number) => void
}

export function DataGrid({
  docs,
  collection,
  isLoading,
  onUpdateDoc,
  onDeleteDoc,
  onDuplicateDoc,
  onBulkDelete,
  page,
  limit,
  totalDocs,
  onPageChange,
}: DataGridProps) {
  const [view, setView] = useState<ViewMode>("json")
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleToggleSelection = (id: any) => {
    const newSelection = new Set(selectedIds)
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id)
    setSelectedIds(newSelection)
  }

  const handleToggleAll = () => {
    if (selectedIds.size === docs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(docs.map((d) => d._id)))
    }
  }

  const handleConfirmBulkDelete = async () => {
    await onBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setConfirmOpen(false)
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8 text-muted-foreground">Loading documents...</div>
    }
    if (!docs || docs.length === 0) {
      return <div className="text-center p-8 text-muted-foreground">No documents found in this collection.</div>
    }

    switch (view) {
      case "table":
        return (
          <TableView
            docs={docs}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onUpdateDoc={onUpdateDoc}
          />
        )
      case "list":
        return <ListView docs={docs} selectedIds={selectedIds} onToggleSelection={handleToggleSelection} />
      case "json":
      default:
        return (
          <div className="space-y-3 p-1">
            {docs.map((doc) => (
              <JsonView
                key={String(doc._id)}
                doc={doc}
                isSelected={selectedIds.has(doc._id)}
                onToggleSelection={() => handleToggleSelection(doc._id)}
                onUpdate={onUpdateDoc}
                onDelete={onDeleteDoc}
                onDuplicate={onDuplicateDoc}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <DataGridToolbar
        view={view}
        onViewChange={setView}
        selectedCount={selectedIds.size}
        onBulkDelete={() => setConfirmOpen(true)}
        page={page}
        limit={limit}
        totalDocs={totalDocs}
        onPageChange={onPageChange}
        isAllSelected={docs.length > 0 && selectedIds.size === docs.length}
        onToggleAll={handleToggleAll}
      />

      <div className="flex-1 overflow-y-auto">{renderContent()}</div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} documents?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to permanently delete the selected documents from{" "}
              <span className="font-semibold">{collection}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
