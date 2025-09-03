import Link from "next/link"

export default function DocsIndexPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-balance">Documentation</h1>
        <p className="text-sm text-muted-foreground">
          First-time guides, feature deep-dives, examples, privacy notes, and keyboard shortcuts.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded border p-4">
          <h2 className="text-lg font-medium">Redis Tester</h2>
          <p className="text-sm text-muted-foreground">
            Test Redis connections, run commands, and understand responses with step-by-step guidance.
          </p>
          <div className="mt-3">
            <Link href="/docs/redis" className="underline">
              Open Redis Docs
            </Link>
          </div>
        </article>

        <article className="rounded border p-4">
          <h2 className="text-lg font-medium">MongoDB Manager</h2>
          <p className="text-sm text-muted-foreground">
            Explore, filter, paginate, bulk edit, import/export, and use AI assistance on live data.
          </p>
          <div className="mt-3">
            <Link href="/docs/mongodb" className="underline">
              Open MongoDB Docs
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}
