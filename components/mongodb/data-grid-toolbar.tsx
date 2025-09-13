// components/mongodb/data-grid-toolbar.tsx
import { Button } from "@/components/ui/button"
import { List, Table, Braces, Trash2 } from "lucide-react"
import { ViewMode } from "./data-grid"
import { Checkbox } from "@/components/ui/checkbox"

export function DataGridToolbar({ view, onViewChange, selectedCount, onBulkDelete, page, limit, totalDocs, onPageChange, isAllSelected, onToggleAll }) {
  const totalPages = Math.ceil(totalDocs / limit)
  return (
    <div className="flex items-center gap-4 p-2 border-b sticky top-0 bg-background z-10">
      <div className="flex items-center gap-2">
        <Checkbox id="select-all" checked={isAllSelected} onCheckedChange={onToggleAll} />
        {selectedCount > 0 && (
          <>
            <span className="text-sm font-medium">{selectedCount} selected</span>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <Button variant={view === 'json' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('json')}><Braces className="h-4 w-4 mr-2" /> JSON</Button>
        <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('table')}><Table className="h-4 w-4 mr-2" /> Table</Button>
        <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => onViewChange('list')}><List className="h-4 w-4 mr-2" /> List</Button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</Button>
        <span>Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</Button>
      </div>
    </div>
  )
}