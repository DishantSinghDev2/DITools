import { PrivacySecurityNotice } from "@/components/privacy-security-notice"

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6 text-pretty">Privacy Policy</h1>
      <PrivacySecurityNotice />
      <section className="prose prose-invert max-w-none text-sm leading-relaxed mt-8">
        <h2>Scope</h2>
        <p>
          This tool processes your database connection details and queries only for the duration of each request. No
          credentials or data are stored server-side. You can purge all local traces at any time.
        </p>
        <h2>Data Handling</h2>
        <ul className="list-disc pl-5">
          <li>No server-side persistence of credentials or query data.</li>
          <li>No analytics or tracking scripts.</li>
          <li>Local UI state is kept in memory and optionally in your browser storage if you choose.</li>
        </ul>
        <h2>Security</h2>
        <p>
          All database operations are executed transiently. Do not use this tool in untrusted networks. Prefer read-only
          users when possible.
        </p>
        <h2>Purge</h2>
        <p>Use the “Purge Browser Data” control to clear localStorage, sessionStorage, caches, and in-memory state.</p>
      </section>
    </main>
  )
}
