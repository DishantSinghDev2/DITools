"use client"

import { useState } from "react"

export type CommandConsoleProps = {
  onRun: (cmd: string) => Promise<any>
  disabled: boolean
}

export function CommandConsole({ onRun, disabled }: CommandConsoleProps) {
  const [cmd, setCmd] = useState('{ "ping": 1 }')
  const [out, setOut] = useState<any>(null)
  const [running, setRunning] = useState(false)

  return (
    <div className="rounded-md border p-3 space-y-2">
      <h3 className="font-medium text-sm">Command Console</h3>
      <textarea
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        rows={6}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
      />
      <div className="flex items-center gap-2">
        <button
          disabled={disabled || running}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
          onClick={async () => {
            setRunning(true)
            try {
              const res = await onRun(cmd)
              setOut(res)
            } catch (e: any) {
              setOut({ error: String(e?.message || e) })
            } finally {
              setRunning(false)
            }
          }}
        >
          {running ? "Running…" : "Run Command"}
        </button>
      </div>
      {out && (
        <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted/50 p-2 rounded">
          {JSON.stringify(out, null, 2)}
        </pre>
      )}
    </div>
  )
}
