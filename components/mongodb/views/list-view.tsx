// components/mongodb/views/list-view.tsx
"use client"

import { MongoDoc } from "../data-grid"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface ListViewProps {
  docs: MongoDoc[]
  selectedIds: Set<any>
  onToggleSelection: (id: any) => void
}

export function ListView({ docs, selectedIds, onToggleSelection }: ListViewProps) {
  return (
    <div className="p-2 space-y-2">
      {docs.map(doc => {
        const idString = String(doc._id?.$oid || doc._id)
        // Get first 3 fields besides _id for a summary
        const summaryFields = Object.entries(doc)
          .filter(([key]) => key !== '_id')
          .slice(0, 3)

        return (
          <div
            key={idString}
            className={cn(
              "flex items-center gap-4 p-3 border rounded-md cursor-pointer transition-colors",
              "hover:bg-gray-100",
              selectedIds.has(doc._id) && "bg-blue-50 border-blue-300"
            )}
            onClick={() => onToggleSelection(doc._id)}
          >
            <Checkbox
              checked={selectedIds.has(doc._id)}
              // The onClick on the parent div handles toggling
              // We readOnly here to prevent double-firing events
              readOnly 
            />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold truncate" title={idString}>
                _id: {idString}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                {summaryFields.map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-1 truncate">
                    <span className="font-medium text-gray-800">{key}:</span>
                    <span className="truncate text-gray-500">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
                {summaryFields.length === 0 && <span className="italic">No other fields.</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}