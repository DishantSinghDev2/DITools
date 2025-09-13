// components/mongodb/data-grid-toolbar.tsx
import { Button } from "@/components/ui/button"
import { List, Table, Braces, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export type ViewMode = "json" | "table" | "list"

type DataGridToolbarProps = {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  selectedCount: number
  onBulkDelete: () => void
  page: number
  limit: number
  totalDocs: number
  onPageChange: (page: number) => void
  isAllSelected: boolean
  onToggleAll: (checked: boolean) => void
}

export function DataGridToolbar({
  view,
  onViewChange,
  selectedCount,
  onBulkDelete,
  page,
  limit,
  totalDocs,
  onPageChange,
  isAllSelected,
  onToggleAll,
}: DataGridToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit))

  return (
    <div className="flex items-center gap-4 p-2 border-b sticky top-0 bg-background z-10">
      {/* Selection & Bulk Actions */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
        />
        {selectedCount > 0 && (
          <>
            <span className="text-sm font-medium">{selectedCount} selected</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={onBulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* View Mode Switch */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant={view === "json" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("json")}
        >
          <Braces className="h-4 w-4 mr-2" /> JSON
        </Button>
        <Button
          variant={view === "table" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("table")}
        >
          <Table className="h-4 w-4 mr-2" /> Table
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("list")}
        >
          <List className="h-4 w-4 mr-2" /> List
        </Button>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
