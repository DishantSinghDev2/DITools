"use client"
import { Block, TextLine } from "./primitives"

export default function RedisTesterSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
      <div className="space-y-2">
        <Block className="h-8 w-72" />
        <TextLine className="w-2/3" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Block className="h-10 w-full" />
        <Block className="h-10 w-full" />
        <Block className="h-10 w-full" />
        <Block className="h-10 w-full" />
      </div>
      <div className="flex items-center gap-2">
        <Block className="h-9 w-28" />
        <Block className="h-9 w-28" />
      </div>
      <div className="rounded-lg border p-4 space-y-2">
        <Block className="h-6 w-40" />
        {[...Array(6)].map((_, i) => (
          <TextLine key={i} />
        ))}
      </div>
    </div>
  )
}
