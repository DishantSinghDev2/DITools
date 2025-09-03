"use client"
import { Block, Circle, TextLine } from "./primitives"

export default function MongoDBManagerSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full gap-4 p-4">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-4">
        <Block className="h-10 w-full" />
        <Block className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Circle className="h-5 w-5" />
          <TextLine className="w-28" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                <TextLine className="w-36" />
              </div>
              <div className="ml-5 space-y-2">
                {[...Array(3)].map((__, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Circle className="h-3 w-3" />
                    <TextLine className="w-28" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Top toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Block className="h-9 w-28" />
            <Block className="h-9 w-28" />
            <Block className="h-9 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Block className="h-9 w-24" />
            <Block className="h-9 w-9" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <Block key={i} className="h-8 w-32" />
          ))}
          <Block className="h-8 w-8" />
        </div>

        {/* Content split */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Results/data (span 2 on large) */}
          <section className="col-span-1 lg:col-span-2 rounded-lg border p-4">
            <div className="mb-4 grid grid-cols-4 gap-3">
              <Block className="h-9 w-full col-span-3" />
              <Block className="h-9 w-full col-span-1" />
            </div>
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Block key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <TextLine className="w-24" />
              <div className="flex items-center gap-2">
                <Block className="h-8 w-20" />
                <Block className="h-8 w-20" />
              </div>
            </div>
          </section>

          {/* Details / AI placeholder */}
          <section className="col-span-1 rounded-lg border p-4 space-y-3">
            <Block className="h-6 w-40" />
            {[...Array(6)].map((_, i) => (
              <TextLine key={i} />
            ))}
            <Block className="h-40 w-full" />
          </section>
        </div>
      </main>

      {/* Right AI panel placeholder (visible on xl+) */}
      <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-3">
        <Block className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Block key={i} className="h-6 w-full" />
          ))}
        </div>
        <Block className="mt-2 h-32 w-full" />
      </aside>
    </div>
  )
}
