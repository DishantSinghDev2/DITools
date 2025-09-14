"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { redactPayloadForAI } from "@/lib/redact"

type AIAction =
  | { type: "find"; db: string; collection: string; params?: any; reason?: string }
  | {
      type: "aggregate"
      db: string
      collection: string
      params?: { pipeline?: any[]; limit?: number }
      reason?: string
    }
  | { type: "insertMany"; db: string; collection: string; params?: { docs?: any[] }; reason?: string }
  | {
      type: "updateMany"
      db: string
      collection: string
      params?: { filter?: any; update?: any; upsert?: boolean }
      reason?: string
    }
  | { type: "deleteMany"; db: string; collection: string; params?: { filter?: any }; reason?: string }
  | { type: "command"; db: string; collection?: string; params?: any; reason?: string }

export function AIAssistant(props: {
  connStrPresent: boolean
  selectedDb: string
  selectedColl: string
  collections: string[]
  docs: any[]
  onExecutePlan: (actions: AIAction[]) => Promise<void>
}) {
  const { connStrPresent, selectedDb, selectedColl, collections, docs, onExecutePlan } = props

  // Grants
  const [grantDb, setGrantDb] = useState<string>("") // exact DB name
  const [grantCollections, setGrantCollections] = useState<string[]>([]) // list of collection names
  const [grantDocsMode, setGrantDocsMode] = useState<"none" | "currentResults" | "custom">("none")
  const [customDocs, setCustomDocs] = useState("[]")

  // AI controls
  const [prompt, setPrompt] = useState("Explain the structure of my selected collection and suggest useful indexes.")
  const [autoExecute, setAutoExecute] = useState(false)
  const [consented, setConsented] = useState(false)

  // Memory (local-only)
  const [memorySnippets, setMemorySnippets] = useState<string[]>([])
  const [newMemory, setNewMemory] = useState("")
  const memoryKey = "mongo-ai:memory"

  const isMobile = useMobile()

  useEffect(() => {
    if (isMobile && autoExecute) {
      setAutoExecute(false)
    }
  }, [isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const saved = localStorage.getItem(memoryKey)
      if (saved) setMemorySnippets(JSON.parse(saved))
    } catch {
      /* ignore */
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(memoryKey, JSON.stringify(memorySnippets))
    } catch {
      /* ignore */
    }
  }, [memorySnippets])

  function addMemory() {
    if (!newMemory.trim()) return
    setMemorySnippets((m) => [newMemory.trim(), ...m].slice(0, 50))
    setNewMemory("")
  }
  function clearMemory() {
    setMemorySnippets([])
    try {
      localStorage.removeItem(memoryKey)
    } catch {
      /* ignore */
    }
  }

  // Build grantedData to send to AI
  const grantedData = useMemo(() => {
    let grantedDocs: any[] = []
    if (grantDocsMode === "currentResults") {
      grantedDocs = (docs || []).slice(0, 50) // keep small
    } else if (grantDocsMode === "custom") {
      try {
        const parsed = JSON.parse(customDocs || "[]")
        grantedDocs = Array.isArray(parsed) ? parsed.slice(0, 100) : [parsed]
      } catch {
        grantedDocs = []
      }
    }
    return {
      db: grantDb || selectedDb || "",
      collections: (grantCollections.length ? grantCollections : selectedColl ? [selectedColl] : []).slice(0, 20),
      sampleDocs: grantedDocs,
      sampleDocsCount: grantedDocs.length,
    }
  }, [grantDb, selectedDb, grantCollections, selectedColl, grantDocsMode, customDocs, docs])

  // Streaming state
  const [streaming, setStreaming] = useState(false)
  const [aiText, setAiText] = useState("")
  const [aiPlan, setAiPlan] = useState<AIAction[] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Preview toggle for sanitized payload
  const [showPreview, setShowPreview] = useState(false)

  // Build raw payload and sanitized preview for consent UI
  const rawPayload = useMemo(() => {
    return {
      prompt,
      grants: {
        db: grantDb || selectedDb || "",
        collections: grantCollections.length ? grantCollections : selectedColl ? [selectedColl] : [],
        docs: grantDocsMode,
      },
      grantedData,
      memorySnippets,
      preferences: { autoExecute },
    }
  }, [
    prompt,
    grantDb,
    selectedDb,
    grantCollections,
    selectedColl,
    grantDocsMode,
    grantedData,
    memorySnippets,
    autoExecute,
  ])

  const sanitizedPayload = useMemo(() => redactPayloadForAI(rawPayload), [rawPayload])

  async function runAI() {
    if (!consented) {
      alert("Please read the warning and check the consent box before using AI.")
      return
    }
    setStreaming(true)
    setAiText("")
    setAiPlan(null)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/mongodb/api/ai/gemini", {
        method: "POST",
        body: JSON.stringify(sanitizedPayload),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const text = await res.text()
        throw new Error(text || `AI request failed: ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        setAiText((t) => t + decoder.decode(value, { stream: true }))

        // Try to extract AI_PLAN JSON from fenced code block:
        // \`\`\`json\n{ ... }\n\`\`\`
        const planMatch = buffer.match(/AI_PLAN[\s\S]*?```json\s*([\s\S]*?)```/i)
        if (planMatch) {
          try {
            const parsed = JSON.parse(planMatch[1])
            if (Array.isArray(parsed?.actions)) {
              setAiPlan(parsed.actions as AIAction[])
            }
          } catch {
            // ignore parse errors until stream completes
          }
        }
      }
    } catch (e: any) {
      setAiText((t) => (t ? t + "\n\n[Error] " + String(e?.message || e) : "[Error] " + String(e?.message || e)))
    } finally {
      setStreaming(false)
      abortRef.current = null
      setConsented(false)
    }
  }

  async function executePlan() {
    if (!aiPlan?.length) return
    if (!autoExecute) {
      const ok = confirm(
        `AI proposed ${aiPlan.length} action(s). Do you want to execute them now?\n\nYou can enable auto-execution to skip this prompt.`,
      )
      if (!ok) return
    }
    await onExecutePlan(aiPlan)
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <h3 className="font-medium text-sm">AI Assistant (Gemini)</h3>

      <div className="rounded bg-card text-card-foreground p-2 text-xs">
        <p className="font-medium">Warning & Consent</p>
        <ul className="list-disc pl-4 space-y-1 mt-1 text-muted-foreground">
          <li>Only the data you explicitly grant below will be sent to Gemini.</li>
          <li>No credentials or secrets are stored or logged by this app. Memory is local to your browser.</li>
          <li>Enable auto-execution only if you trust AI to run write operations on your behalf.</li>
        </ul>
        <label className="mt-2 inline-flex items-center gap-2">
          <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
          <span>I understand and consent to share ONLY the granted data with Gemini.</span>
        </label>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          placeholder="Ask questions about your data or request operations (e.g., suggest indexes, transform fields, etc.)"
        />
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-medium">Grants</p>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <label className="text-[11px] text-muted-foreground">Database</label>
            <input
              value={grantDb}
              onChange={(e) => setGrantDb(e.target.value)}
              placeholder={selectedDb || "database name"}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-[11px] text-muted-foreground">Collections (comma-separated)</label>
            <input
              value={grantCollections.join(",")}
              onChange={(e) =>
                setGrantCollections(
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder={selectedColl ? selectedColl : (collections || []).slice(0, 3).join(",")}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-[11px] text-muted-foreground">Documents to share</label>
            <select
              value={grantDocsMode}
              onChange={(e) => setGrantDocsMode(e.target.value as any)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              <option value="none">None</option>
              <option value="currentResults">Current results (up to 50 docs)</option>
              <option value="custom">Custom JSON array</option>
            </select>
          </div>
          {grantDocsMode === "custom" && (
            <textarea
              value={customDocs}
              onChange={(e) => setCustomDocs(e.target.value)}
              rows={4}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
              placeholder='[{"_id":"...","name":"Alice"}]'
            />
          )}
        </div>
      </div>

      {isMobile && (
        <div className="rounded bg-muted/50 p-2 text-[11px]">
          Advanced AI features are limited on mobile. For auto-execution and richer tooling, please use a desktop
          device.
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
            disabled={isMobile}
          />
          {isMobile ? "Auto-execution unavailable on mobile" : "Allow auto-execution of AI plans"}
        </label>
        <button
          onClick={runAI}
          disabled={!connStrPresent || !consented || streaming}
          className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
          title={connStrPresent ? "" : "Connect first to enable AI"}
        >
          {streaming ? "Thinking…" : "Ask AI"}
        </button>
        {streaming && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            title="Cancel AI"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium">Response</label>
        <div className="rounded-md border bg-muted/40 p-2 text-xs whitespace-pre-wrap break-words">
          {aiText || "No response yet."}
        </div>
        {aiPlan?.length ? (
          <div className="rounded-md border bg-card text-card-foreground p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">AI Plan Detected</p>
              <button
                onClick={executePlan}
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                title="Execute proposed actions"
              >
                Execute Plan
              </button>
            </div>
            <pre className="text-[11px] mt-2 overflow-auto max-h-40">{JSON.stringify(aiPlan, null, 2)}</pre>

            <AffectedDocs plan={aiPlan} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-medium">Memory (Local Only)</p>
        <div className="flex items-center gap-2">
          <input
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Add a preference or note for the AI…"
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <button onClick={addMemory} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            Save
          </button>
          <button onClick={clearMemory} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            Clear
          </button>
        </div>
        <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-1 max-h-32 overflow-auto">
          {memorySnippets.length ? memorySnippets.map((m, i) => <li key={i}>{m}</li>) : <li>No memory saved.</li>}
        </ul>
      </div>

      <div className="rounded bg-muted/40 p-2 text-[11px]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-md border px-2 py-0.5 text-[11px] hover:bg-muted"
          >
            {showPreview ? "Hide" : "Preview"} sanitized data to Gemini
          </button>
          <span className="text-muted-foreground">
            We automatically remove/obfuscate any potential secrets before sending.
          </span>
        </div>
        {showPreview ? (
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(sanitizedPayload, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  )
}

function AffectedDocs({ plan }: { plan: any[] }) {
  // collect ids from actions where available: action.ids or params.docs[_id] or params.filter by _id or $in
  const ids = new Set<string>()
  try {
    for (const a of plan || []) {
      if (Array.isArray(a?.ids)) {
        for (const v of a.ids) if (v) ids.add(String(v))
      }
      const p = a?.params || {}
      // inserted docs
      if (Array.isArray(p.docs)) {
        for (const d of p.docs) {
          const id = d?._id ?? d?.id
          if (id) ids.add(String(id))
        }
      }
      // filters by _id or $in
      const f = p.filter || {}
      const fid = f?._id
      if (typeof fid === "string") ids.add(fid)
      else if (fid && typeof fid === "object" && Array.isArray(fid.$in)) {
        for (const v of fid.$in) if (v) ids.add(String(v))
      }
    }
  } catch {
    // ignore
  }
  const list = Array.from(ids).slice(0, 50)
  if (!list.length) return null
  return (
    <div className="mt-2">
      <p className="text-[11px] font-medium mb-1">Affected documents</p>
      <div className="flex flex-wrap gap-2">
        {list.map((id) => (
          <button
            key={id}
            className="rounded border px-2 py-0.5 text-[11px] hover:bg-muted"
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent("ai-jump-to-doc", { detail: { id } }))
              } catch {
                // ignore
              }
            }}
            title="Jump to document"
          >
            _id: {id}
          </button>
        ))}
      </div>
    </div>
  )
}
