"use client"
import { Block, TextLine } from "./primitives"

export default function ChangelogSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6">
        <Block className="h-9 w-64" />
        <TextLine className="mt-2 w-80" />
      </div>
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <Block className="h-6 w-56" />
              <Block className="h-6 w-24" />
            </div>
            <div className="space-y-2">
              <TextLine className="w-5/6" />
              <TextLine className="w-4/6" />
              <TextLine className="w-3/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
