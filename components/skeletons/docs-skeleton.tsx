"use client"
import { Block, TextLine } from "./primitives"

export default function DocsSkeleton() {
  return (
    <div className="flex w-full gap-6 p-6">
      <aside className="hidden md:block w-64 shrink-0">
        <div className="space-y-3">
          <Block className="h-8 w-48" />
          {[...Array(8)].map((_, i) => (
            <Block key={i} className="h-6 w-40" />
          ))}
        </div>
      </aside>
      <main className="flex-1 space-y-6">
        <div className="space-y-2">
          <Block className="h-8 w-72" />
          <TextLine className="w-3/4" />
          <TextLine className="w-2/3" />
          <TextLine className="w-1/2" />
        </div>
        <Block className="h-56 w-full" />
        <div className="space-y-2">
          <Block className="h-8 w-60" />
          <TextLine className="w-4/5" />
          <TextLine className="w-3/5" />
          <TextLine className="w-2/5" />
        </div>
        <Block className="h-56 w-full" />
      </main>
    </div>
  )
}
