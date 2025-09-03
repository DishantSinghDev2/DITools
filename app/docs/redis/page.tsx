import Link from "next/link"
import { SidebarNav } from "@/components/docs/sidebar-nav"
import { ContentSection } from "@/components/docs/content-section"
import { CodeBlock } from "@/components/docs/code-block"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "connect", label: "Connecting" },
  { id: "commands", label: "Running Commands" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "shortcuts", label: "Keyboard Shortcuts" },
  { id: "faq", label: "FAQ" },
]

export default function RedisDocs() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="md:flex md:gap-8">
        <div className="md:sticky md:top-20 md:h-[calc(100dvh-6rem)] md:overflow-auto md:py-2">
          <SidebarNav items={sections} />
        </div>
        <div className="flex-1 space-y-8">
          <header className="mb-2">
            <h1 className="text-2xl font-semibold text-balance">Redis Tester Guide</h1>
            <p className="text-sm text-muted-foreground">
              Everything you need to connect to Redis, run commands safely, and understand responses.
            </p>
          </header>

          <ContentSection
            id="overview"
            title="Overview"
            description="Validate connectivity and run safe commands from your browser."
          >
            <ul className="list-disc pl-5 text-sm">
              <li>Stateless backend; no secrets are stored or logged.</li>
              <li>Client-first UX with clear loading and error states.</li>
              <li>Privacy controls to purge all local traces.</li>
            </ul>
          </ContentSection>

          <ContentSection id="connect" title="Connecting" description="Use a URL or host/port with credentials.">
            <CodeBlock
              language="bash"
              label="Examples"
              code={`redis://default:<password>@hostname:6379
rediss://default:<password>@hostname:6380`}
            />
            <p className="text-sm text-muted-foreground">
              We never store your connection string. Each request uses it transiently to perform the action.
            </p>
          </ContentSection>

          <ContentSection
            id="commands"
            title="Running Commands"
            description="Execute commands and inspect JSON results."
          >
            <CodeBlock
              language="json"
              label="API"
              code={`POST /api/test-commands
{
  "connectionString": "redis://...",
  "commands": [["PING"], ["GET","key1"], ["SET","key2","value"]]
}`}
            />
          </ContentSection>

          <ContentSection id="troubleshooting" title="Troubleshooting">
            <ul className="list-disc pl-5 text-sm">
              <li>Check firewall/VPC/allowlist and ensure the port is open.</li>
              <li>Use rediss:// and correct certificates for TLS.</li>
              <li>Verify username/password and database index when applicable.</li>
            </ul>
          </ContentSection>

          <ContentSection id="privacy" title="Privacy & Security">
            <ul className="list-disc pl-5 text-sm">
              <li>No persistence: connection details are not stored server-side.</li>
              <li>Local-only data: UI state lives in your browser; purge anytime.</li>
              <li>
                Attribution: © DishIs Technologies —{" "}
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
  "redis.run-test": "Mod+Enter",
  "redis.clear": "Escape"
}`}
            />
          </ContentSection>

          <ContentSection id="faq" title="FAQ">
            <p className="text-sm">Q: Do you store my credentials?</p>
            <p className="text-sm text-muted-foreground">A: No. They are used only during the request.</p>
          </ContentSection>
        </div>
      </div>
    </main>
  )
}
