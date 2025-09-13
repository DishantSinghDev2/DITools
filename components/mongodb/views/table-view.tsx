// components/mongodb/views/table-view.tsx
"use client"

import { useMemo, useState } from "react"
import { MongoDoc } from "../data-grid"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TableViewProps {
  docs: MongoDoc[]
  selectedIds: Set<any>
  onToggleSelection: (id: any) => void
  onUpdateDoc: (id: any, update: object) => Promise<void>
}

// Helper to display cell content appropriately
const renderCellContent = (value: any) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }
  if (typeof value === 'object') {
    return <span className="font-mono text-blue-500">{JSON.stringify(value)}</span>
  }
  if (typeof value === 'boolean') {
    return <span className="font-semibold text-purple-600">{String(value)}</span>
  }
  if (typeof value === 'number') {
    return <span className="text-green-600">{value}</span>
  }
  return String(value)
}

export function TableView({ docs, selectedIds, onToggleSelection, onUpdateDoc }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ docId: any; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const columns = useMemo(() => {
    const columnSet = new Set<string>()
    docs.forEach(doc => {
      Object.keys(doc).forEach(key => columnSet.add(key))
    })
    const cols = Array.from(columnSet)
    // Ensure _id is always the first column
    const idIndex = cols.indexOf('_id')
    if (idIndex > -1) {
      cols.splice(idIndex, 1)
      cols.unshift('_id')
    }
    return cols
  }, [docs])

  const handleStartEdit = (doc: MongoDoc, field: string) => {
    if (field === '_id') return // Cannot edit _id
    setEditingCell({ docId: doc._id, field })
    const currentValue = doc[field]
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue ?? ''))
    setError(null)
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setError(null)
  }

  const handleSaveEdit = async () => {
    if (!editingCell) return

    let parsedValue: any = editValue;
    const originalValue = docs.find(d => d._id === editingCell.docId)?.[editingCell.field]

    try {
      // Attempt to parse the value back to its original type
      if (typeof originalValue === 'number') {
        parsedValue = parseFloat(editValue)
        if (isNaN(parsedValue)) throw new Error("Not a valid number.")
      } else if (typeof originalValue === 'boolean') {
        if (editValue.toLowerCase() === 'true') parsedValue = true
        else if (editValue.toLowerCase() === 'false') parsedValue = false
        else throw new Error("Must be 'true' or 'false'.")
      } else if (typeof originalValue === 'object' && originalValue !== null) {
        parsedValue = JSON.parse(editValue)
      }
      // String remains a string
      
      await onUpdateDoc(editingCell.docId, { $set: { [editingCell.field]: parsedValue } })
      setEditingCell(null)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="w-full h-full overflow-auto">
      <table className="min-w-full text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 w-12">
                {/* The select-all checkbox is in the toolbar */}
            </th>
            {columns.map(col => (
              <th key={col} className="px-4 py-2 text-left font-semibold text-gray-600 tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {docs.map(doc => (
            <tr key={String(doc._id)} className={cn("hover:bg-gray-100", selectedIds.has(doc._id) && "bg-blue-50")}>
              <td className="px-4 py-2">
                <Checkbox checked={selectedIds.has(doc._id)} onCheckedChange={() => onToggleSelection(doc._id)} />
              </td>
              {columns.map(col => {
                const isEditing = editingCell?.docId === doc._id && editingCell?.field === col
                return (
                  <td
                    key={col}
                    className="px-4 py-2 whitespace-nowrap truncate max-w-xs"
                    title={typeof doc[col] === 'object' ? JSON.stringify(doc[col]) : String(doc[col])}
                    onDoubleClick={() => handleStartEdit(doc, col)}
                  >
                    {isEditing ? (
                      <div>
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          className="h-8 text-sm"
                        />
                         {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                      </div>
                    ) : (
                      renderCellContent(doc[col])
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}