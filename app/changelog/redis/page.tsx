import type { ChangelogEntry } from "@/components/changelog/changelog-page"
import { ChangelogPage } from "@/components/changelog/changelog-page"

const entries: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2025-09-02",
    badge: "improve",
    highlights: [
      "Enhanced privacy notice with explicit browser-only processing and purge control",
      "Better error diagnostics and connection timeout handling",
    ],
    sections: [
      {
        title: "Enhancements",
        items: [
          "Faster latency reporting and INFO parsing",
          "TLS/ACL/Sentinel guidance in the form with validation",
          "Accessible labels and descriptions for all inputs",
        ],
      },
      {
        title: "UX",
        items: [
          "Responsive layout for mobile; suggests desktop for advanced features",
          "Added quick links to Terms and Privacy, and dishis.tech",
        ],
      },
    ],
    links: [{ label: "Open Redis Tester", href: "/" }],
  },
  {
    version: "1.0.0",
    date: "2025-08-30",
    badge: "new",
    highlights: ["Initial release of Redis Connection Tester"],
    sections: [
      {
        title: "Features",
        items: [
          "Test PING and run safe commands",
          "No server persistence or logging of user data",
          "One-click purge of all local data",
        ],
      },
    ],
  },
]

export default function RedisChangelogPage() {
  return <ChangelogPage toolName="Redis Tester" toolHref="/" entries={entries} />
}
