"use client"

import { useMemo } from "react"
import { Pin, X } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

export type CollectionTab = {
  id: string
  db: string
  collection: string
  isPinned?: boolean
}

interface CollectionTabsProps {
  tabs: CollectionTab[]
  activeId?: string
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
  onPin: (id: string) => void
  className?: string
}

function SortableTab({ tab, isActive, onActivate, onClose, onPin }: {
  tab: CollectionTab
  isActive: boolean
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onPin: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "flex-shrink-0 relative rounded-t-md border border-b-0",
        isActive ? "bg-background " : "bg-muted hover:bg-background/60 border-transparent",
        isDragging && "shadow-lg opacity-80"
      )}
    >
      <div className="flex items-center gap-1.5 whitespace-nowrap px-3 h-8 text-xs">
        <button
          {...listeners}
          onClick={() => onActivate(tab.id)}
          className="flex-1 text-left font-mono pr-2"
          title={`${tab.db}.${tab.collection}`}
        >
          {tab.collection}
        </button>

        <button
          onClick={() => onPin(tab.id)}
          className="p-0.5 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
          title={tab.isPinned ? "Unpin Tab" : "Pin Tab"}
        >
          {tab.isPinned
            ? <Pin className="h-3.5 w-3.5" fill="currentColor" />
            : <Pin className="h-3.5 w-3.5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose(tab.id)
          }}
          className="p-0.5 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          title="Close Tab"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function CollectionTabs({
  tabs,
  activeId,
  onActivate,
  onClose,
  onReorder,
  onPin,
  className,
}: CollectionTabsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string)
    }
  }

  const { pinnedTabs, unpinnedTabs } = useMemo(() => {
    const pinned: CollectionTab[] = []
    const unpinned: CollectionTab[] = []
    tabs.forEach(tab => (tab.isPinned ? pinned : unpinned).push(tab))
    return { pinnedTabs: pinned, unpinnedTabs: unpinned }
  }, [tabs])

  return (
    <div className={cn("flex items-end gap-1 overflow-x-auto border-t bg-muted/40 px-2 shrink-0", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        {/* Pinned Tabs */}
        <SortableContext items={pinnedTabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          {pinnedTabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeId}
              onActivate={onActivate}
              onClose={onClose}
              onPin={onPin}
            />
          ))}
        </SortableContext>

        {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
          <div className="w-px bg-border self-stretch my-1.5" />
        )}

        {/* Unpinned Tabs */}
        <SortableContext items={unpinnedTabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          {unpinnedTabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeId}
              onActivate={onActivate}
              onClose={onClose}
              onPin={onPin}
            />
          ))}
        </SortableContext>
      </DndContext>

      {tabs.length === 0 && (
        <div className="text-xs text-muted-foreground px-4 py-2">Select a collection to open a tab</div>
      )}
    </div>
  )
}