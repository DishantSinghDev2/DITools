import type { ChangelogEntry } from "@/components/changelog/changelog-page"
import { ChangelogPage } from "@/components/changelog/changelog-page"

const entries: ChangelogEntry[] = [
  {
    version: "1.3.0",
    date: "2025-09-02",
    badge: "new",
    highlights: [
      "Gemini AI Assistant with streaming (generateContentStream), granular data grants, and optional auto-execution",
      "Local-only AI memory with view/delete controls",
    ],
    sections: [
      {
        title: "AI",
        items: [
          "Streamed responses with progressive steps and loading states",
          "Consent-first workflow: only granted data sent to Gemini",
          "Auto-execution prompts; disabled on mobile for safety",
        ],
      },
      {
        title: "Data Explorer",
        items: [
          "Bulk insert/update/delete with dry-run preview",
          "Import/Export JSON and CSV with schema inference",
          "Command console with local history",
        ],
      },
      {
        title: "Customization & UX",
        items: [
          "Resizable, adjustable panels; layout saved in browser storage",
          "Responsive on mobile; recommends desktop for advanced features",
          "Privacy & Terms links; purge-all-traces control",
        ],
      },
    ],
    links: [{ label: "Open MongoDB Manager", href: "/mongodb" }],
  },
  {
    version: "1.2.0",
    date: "2025-09-01",
    badge: "improve",
    highlights: ["Index management (list/create/drop) and validation rules editor"],
    sections: [
      {
        title: "Indexes",
        items: ["View, create, and drop indexes with safety checks"],
      },
      {
        title: "Validation",
        items: ["Edit and preview collection validation rules"],
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2025-08-28",
    badge: "new",
    highlights: ["Initial MongoDB Manager release"],
    sections: [
      {
        title: "Core",
        items: [
          "List databases and collections",
          "Find and Aggregate with pagination and explain",
          "Stateless API with ephemeral connections",
        ],
      },
    ],
  },
]

export default function MongoChangelogPage() {
  return <ChangelogPage toolName="MongoDB Manager" toolHref="/mongodb" entries={entries} />
}
