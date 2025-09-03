import Link from "next/link"
import { SidebarNav } from "@/components/docs/sidebar-nav"
import { ContentSection } from "@/components/docs/content-section"
import { CodeBlock } from "@/components/docs/code-block"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "connections", label: "Connections" },
  { id: "explorer", label: "Explorer & Filtering" },
  { id: "pagination", label: "Pagination" },
  { id: "bulk", label: "Bulk Edit / Import & Export" },
  { id: "indexes", label: "Indexes" },
  { id: "ai", label: "AI Assistant (Gemini)" },
  { id: "security", label: "Privacy, Redaction, Consent" },
  { id: "shortcuts", label: "Keyboard Shortcuts" },
  { id: "tips", label: "Tips & Best Practices" },
]

export default function MongoDocs() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="md:flex md:gap-8">
        <div className="md:sticky md:top-20 md:h-[calc(100dvh-6rem)] md:overflow-auto md:py-2">
          <SidebarNav items={sections} />
        </div>
        <div className="flex-1 space-y-8">
          <header className="mb-2">
            <h1 className="text-2xl font-semibold text-balance">MongoDB Manager Guide</h1>
            <p className="text-sm text-muted-foreground">
              Browse, filter, paginate, bulk edit, import/export, and use AI on live data.
            </p>
          </header>

          <ContentSection id="overview" title="Overview">
            <ul className="list-disc pl-5 text-sm">
              <li>Stateless API: your connection string is used per-request only, never stored or logged.</li>
              <li>Live data only: no mock data. Actions run against your DB if you confirm.</li>
              <li>Local memory: AI notes, layouts and shortcuts are stored in your browser only.</li>
            </ul>
          </ContentSection>

          <ContentSection id="connections" title="Managing Connections" description="Create and switch profiles.">
            <CodeBlock
              language="json"
              label="Profile"
              code={`{
  "name": "Prod Cluster",
  "connectionString": "mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority",
  "defaultDb": "appdb"
}`}
            />
            <p className="text-sm text-muted-foreground">
              Secrets are masked in the UI. Profiles are saved in localStorage. You can purge all browser data anytime.
            </p>
          </ContentSection>

          <ContentSection id="explorer" title="Explorer & Filtering">
            <p className="text-sm text-muted-foreground">
              Use JSON filters, projections and sort. Results animate on changes and support “jump-to-doc” from AI.
            </p>
            <CodeBlock
              language="json"
              label="Find"
              code={`POST /api/mongodb/find
{
  "connectionString": "mongodb+srv://...",
  "db": "appdb",
  "collection": "users",
  "filter": { "active": true, "role": { "$in": ["admin", "editor"] } },
  "projection": { "email": 1, "name": 1, "_id": 1 },
  "sort": { "createdAt": -1 },
  "limit": 25,
  "skip": 0
}`}
            />
          </ContentSection>

          <ContentSection id="pagination" title="Pagination" description="Use limit/skip and Next/Prev controls.">
            <CodeBlock
              language="json"
              label="Paging"
              code={`{
  "limit": 25,
  "skip": 50
}`}
            />
          </ContentSection>

          <ContentSection id="bulk" title="Bulk Edit / Import & Export">
            <p className="text-sm text-muted-foreground">
              Perform updateMany/deleteMany with previews and CSV/JSON import/export. Newly inserted docs are
              highlighted.
            </p>
            <CodeBlock
              language="json"
              label="updateMany"
              code={`POST /api/mongodb/updateMany
{
  "connectionString": "mongodb+srv://...",
  "db": "appdb",
  "collection": "users",
  "filter": { "newsletter": true },
  "update": { "$set": { "newsletter": false } }
}`}
            />
          </ContentSection>

          <ContentSection id="indexes" title="Indexes" description="List, create, and drop indexes.">
            <CodeBlock
              language="json"
              label="List Indexes"
              code={`POST /api/mongodb/indexes/list
{
  "connectionString": "mongodb+srv://...",
  "db": "appdb",
  "collection": "users"
}`}
            />
          </ContentSection>

          <ContentSection
            id="ai"
            title="AI Assistant (Gemini)"
            description="Streaming answers, granular grants, optional auto-execution, and local-only memory."
          >
            <ul className="list-disc pl-5 text-sm">
              <li>Granular access: grant AI whole DB, selected collections, or specific docs.</li>
              <li>Redaction: secret-like values are masked before sending to Gemini.</li>
              <li>Jump-to-doc: AI plan includes affected IDs; click to scroll and highlight in yellow.</li>
            </ul>
            <CodeBlock
              language="json"
              label="AI Request"
              code={`POST /api/ai/gemini
{
  "prompt": "Find users with expired trials and extend by 7 days",
  "grants": { "db": "appdb", "collections": ["users"] },
  "context": { "filter": { "trialEndsAt": { "$lt": "2025-09-01T00:00:00Z" } } },
  "autoExecute": false
}`}
            />
            <p className="text-xs text-muted-foreground">
              Set GOOGLE_GENERATIVE_AI_API_KEY in Project Settings. Only data you grant is sent; payload is sanitized.
            </p>
          </ContentSection>

          <ContentSection id="security" title="Privacy, Redaction, Consent">
            <ul className="list-disc pl-5 text-sm">
              <li>Defense-in-depth redaction on client and server to avoid leaking secrets.</li>
              <li>Consent banner shows a sanitized preview of data before any AI call.</li>
              <li>Purge control clears local memory, layouts, and cached settings.</li>
              <li>
                © DishIs Technologies —{" "}
                <Link href="https://dishis.tech" className="underline">
                  dishis.tech
                </Link>
              </li>
            </ul>
          </ContentSection>

          <ContentSection id="shortcuts" title="Keyboard Shortcuts">
            <CodeBlock
              language="json"
              code={`{
  "mongo.run-query": "Mod+Enter",
  "mongo.next-page": "Mod+ArrowRight",
  "mongo.prev-page": "Mod+ArrowLeft",
  "mongo.toggle-ai": "Mod+.",
  "app.open-shortcuts": "Shift+?"
}`}
            />
          </ContentSection>

          <ContentSection id="tips" title="Tips & Best Practices">
            <ul className="list-disc pl-5 text-sm">
              <li>Use projections to reduce payload and improve performance.</li>
              <li>Prefer update operators ($set, $inc, $push) for bulk edits.</li>
              <li>Review AI plans; enable auto-execution only when you’re confident.</li>
            </ul>
          </ContentSection>
        </div>
      </div>
    </main>
  )
}
