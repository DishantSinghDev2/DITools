import { detectOS, formatKeyLabel } from "./os"

export type KeyCombo = {
  ctrl?: boolean
  meta?: boolean
  alt?: boolean
  shift?: boolean
  key: string
}

export type ShortcutMap = Record<string, KeyCombo[]>

// Defaults (users can customize in the dialog)
export const DEFAULT_SHORTCUTS: ShortcutMap = {
  "shortcuts.open-settings": [
    { meta: true, key: "K" },
    { ctrl: true, key: "K" },
  ],
  "mongo.run-query": [
    { meta: true, key: "Enter" },
    { ctrl: true, key: "Enter" },
  ],
  "mongo.toggle-ai": [
    { meta: true, shift: true, key: "A" },
    { ctrl: true, shift: true, key: "A" },
  ],
  "mongo.open-import": [
    { meta: true, key: "I" },
    { ctrl: true, key: "I" },
  ],
  "mongo.open-export": [
    { meta: true, key: "E" },
    { ctrl: true, key: "E" },
  ],
  "mongo.toggle-bulk": [
    { meta: true, key: "B" },
    { ctrl: true, key: "B" },
  ],
  "mongo.page-next": [{ alt: true, key: "ArrowRight" }],
  "mongo.page-prev": [{ alt: true, key: "ArrowLeft" }],
  "mongo.copy-doc": [
    { meta: true, key: "C" },
    { ctrl: true, key: "C" },
  ],
}

const STORAGE_KEY = "v0.shortcuts.v1"

export function loadShortcuts(): ShortcutMap {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SHORTCUTS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SHORTCUTS, ...parsed }
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export function saveShortcuts(map: ShortcutMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function comboToString(combo: KeyCombo) {
  const os = detectOS()
  const parts: string[] = []
  if (combo.meta) parts.push(os === "mac" ? "⌘" : "Win")
  if (combo.ctrl) parts.push("Ctrl")
  if (combo.alt) parts.push(os === "mac" ? "⌥" : "Alt")
  if (combo.shift) parts.push("Shift")
  parts.push(formatKeyLabel(combo.key, os))
  return parts.join(" + ")
}

export function parseComboFromEvent(e: KeyboardEvent): KeyCombo {
  return {
    ctrl: e.ctrlKey || undefined,
    meta: e.metaKey || undefined,
    alt: e.altKey || undefined,
    shift: e.shiftKey || undefined,
    key: e.key.length === 1 ? e.key.toUpperCase() : e.key,
  }
}

export function equals(a: KeyCombo, b: KeyCombo) {
  return (
    !!a &&
    !!b &&
    !!a.key &&
    !!b.key &&
    a.key.toLowerCase() === b.key.toLowerCase() &&
    !!a.ctrl === !!b.ctrl &&
    !!a.meta === !!b.meta &&
    !!a.alt === !!b.alt &&
    !!a.shift === !!b.shift
  )
}

export function matches(e: KeyboardEvent, combos: KeyCombo[]) {
  const current = parseComboFromEvent(e)
  return combos.some((c) => equals(c, current))
}
