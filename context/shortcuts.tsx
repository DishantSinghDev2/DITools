"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  DEFAULT_SHORTCUTS,
  type ShortcutMap,
  type KeyCombo,
  loadShortcuts,
  saveShortcuts,
  matches,
  comboToString,
} from "@/lib/shortcuts"

type ActionHandler = (e: KeyboardEvent) => void

type ShortcutsContextType = {
  shortcuts: ShortcutMap
  setShortcut: (actionId: string, combo: KeyCombo, index?: number) => void
  resetShortcuts: () => void
  registerAction: (actionId: string, handler: ActionHandler) => () => void
  comboLabel: (actionId: string) => string | null
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null)

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext)
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutsProvider")
  return ctx
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => loadShortcuts())
  const handlersRef = useRef<Map<string, Set<ActionHandler>>>(new Map())

  const setShortcut = useCallback((actionId: string, combo: KeyCombo, index = 0) => {
    setShortcuts((prev) => {
      const next = { ...prev }
      const arr = [...(next[actionId] || [])]
      arr[index] = combo
      next[actionId] = arr
      saveShortcuts(next)
      return next
    })
  }, [])

  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS)
    saveShortcuts(DEFAULT_SHORTCUTS)
  }, [])

  const registerAction = useCallback((actionId: string, handler: ActionHandler) => {
    const set = handlersRef.current.get(actionId) || new Set<ActionHandler>()
    set.add(handler)
    handlersRef.current.set(actionId, set)
    return () => {
      const s = handlersRef.current.get(actionId)
      if (!s) return
      s.delete(handler)
    }
  }, [])

  const comboLabel = useCallback(
    (actionId: string) => {
      const combos = shortcuts[actionId]
      if (!combos || !combos.length) return null
      return comboToString(combos[0])
    },
    [shortcuts],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore when typing in inputs unless Enter-based actions
      const target = e.target as HTMLElement
      const tag = target?.tagName?.toLowerCase()
      const isTyping = tag === "input" || tag === "textarea" || target?.isContentEditable

      for (const [actionId, combos] of Object.entries(shortcuts)) {
        if (!combos?.length) continue
        if (matches(e, combos)) {
          if (isTyping && !(e.key === "Enter")) continue
          const set = handlersRef.current.get(actionId)
          e.preventDefault()
          if (set && set.size) {
            for (const h of set) {
              try {
                h(e)
              } catch {
                // no-op
              }
            }
          } else {
            window.dispatchEvent(new CustomEvent("shortcut:" + actionId, { detail: { keyboardEvent: e } }))
          }
          break
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcuts])

  const value = useMemo<ShortcutsContextType>(
    () => ({
      shortcuts,
      setShortcut,
      resetShortcuts,
      registerAction,
      comboLabel,
    }),
    [shortcuts, setShortcut, resetShortcuts, registerAction, comboLabel],
  )

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>
}
