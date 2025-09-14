"use client"

import { useState } from "react"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-json"
import "prismjs/themes/prism-tomorrow.css"
import { ChevronRight, Loader2 } from "lucide-react"
import { TruncatedLine } from "./views/truncated-line"

export type CommandConsoleProps = {
  onRun: (cmd: string) => Promise<any>
  disabled?: boolean
  selectedDB: string
}

export function CommandConsole({ onRun, disabled, selectedDB }: CommandConsoleProps) {
  const [cmd, setCmd] = useState('{ "ping": 1 }')
  const [history, setHistory] = useState<{ cmd: string; res: any }[]>([])
  const [running, setRunning] = useState(false)

  async function runCommand(command: string) {
    if (!command.trim()) return
    setRunning(true)
    try {
      const res = await onRun(command)
      setHistory((prev) => [...prev, { cmd: command, res }])
    } catch (e: any) {
      setHistory((prev) => [
        ...prev,
        { cmd: command, res: { error: e?.message || String(e) } },
      ])
    } finally {
      setRunning(false)
      setCmd("")
    }
  }

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && !running) runCommand(cmd)
    }
    const pairs: Record<string, string> = {
      "{": "}",
      "[": "]",
      "(": ")",
      '"': '"',
      "'": "'",
    }
    if (pairs[e.key]) {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const left = cmd.slice(0, start)
      const right = cmd.slice(end)
      const insert = e.key + pairs[e.key]
      setCmd(left + insert + right)
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1
      })
    }
  }

  const renderPrettyJson = (doc: any) => {
    const prettyJson = JSON.stringify(doc, null, 2)
    const highlightedHtml = highlight(prettyJson, languages.json, "json")
    const lines = highlightedHtml.split("\n")

    return (
      <pre className="text-xs w-full font-mono">
        {lines.map((line, index) => (
          <TruncatedLine key={index} lineHtml={line} />
        ))}
      </pre>
    )
  }

  return (
    <div className="h-full flex flex-col font-mono text-sm">
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {history.map((entry, i) => (
          <div key={i}>
            <div className="flex">
              <ChevronRight className="inline w-4 h-4 text-primary" />

              <span className="mb-1">{entry.cmd}</span>
            </div>
            <pre className="text-gray-300 whitespace-pre-wrap">
              {renderPrettyJson(entry.res)}
            </pre>
          </div>
        ))}
        <div className="flex items-start">
          <span className="text-green-500 mr-2 mt-1 flex items-center gap-1">
            {selectedDB ? selectedDB : `mongodb`}
            <ChevronRight className="inline w-4 h-4 text-primary mb-0.5" />
          </span>
          <div className="flex-1">
            <Editor
              value={cmd}
              onValueChange={setCmd}
              highlight={(code) => highlight(code, languages.json)}
              padding={5}
              className="bg-card outline-none min-h-[20px]"
              onKeyDown={handleKeyDown}
              disabled={running}
            />
          </div>
          {running && (
            <Loader2 className="w-4 h-4 ml-2 mt-1 animate-spin text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}
