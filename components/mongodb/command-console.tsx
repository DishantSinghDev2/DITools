"use client"

import { useState } from "react"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-json"
import "prismjs/themes/prism-dark.css"

export type CommandConsoleProps = {
  onRun: (cmd: string) => Promise<any>
  disabled: boolean
}

export function CommandConsole({ onRun, disabled }: CommandConsoleProps) {
  const [cmd, setCmd] = useState('{ "ping": 1 }')
  const [out, setOut] = useState<any[]>([]) // multiple outputs, like terminal history
  const [running, setRunning] = useState(false)

  async function runCommand(command: string) {
    if (!command.trim()) return
    setRunning(true)
    try {
      const res = await onRun(command)
      setOut((prev) => [...prev, { cmd: command, res }])
    } catch (e: any) {
      setOut((prev) => [...prev, { cmd: command, res: { error: String(e?.message || e) } }])
    } finally {
      setRunning(false)
      setCmd("") // clear after run, like a terminal line
    }
  }

  return (
    <div className="h-full flex flex-col text-black font-mono text-sm">
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {out.map((entry, i) => (
          <div key={i}>
            <div className="flex">
              <span className="text-green-400 mr-2">mongodb&gt;</span>
              <span className="text-white">{entry.cmd}</span>
            </div>
            <pre className="text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(entry.res, null, 2)}
            </pre>
          </div>
        ))}
        <div className="flex">
          <span className="text-green-400 mr-2">mongodb&gt;</span>
          <div className="flex-1">
            <Editor
              value={cmd}
              onValueChange={setCmd}
              highlight={(code) => highlight(code, languages.json)}
              padding={5}
              className="bg-transparent outline-none min-h-[20px]"
              onKeyDown={(e: any) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (!disabled && !running) runCommand(cmd)
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
