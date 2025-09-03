export type OS = "mac" | "windows" | "linux" | "unknown"

export function detectOS(): OS {
  if (typeof navigator === "undefined") return "unknown"
  const p = navigator.platform?.toLowerCase() || ""
  const ua = navigator.userAgent?.toLowerCase() || ""
  if (p.includes("mac") || ua.includes("mac os")) return "mac"
  if (p.includes("win")) return "windows"
  if (ua.includes("linux")) return "linux"
  return "unknown"
}

export function modKeyLabel(os: OS) {
  return os === "mac" ? "⌘" : "Ctrl"
}

export function formatKeyLabel(key: string, os: OS) {
  const map: Record<string, string> = {
    meta: os === "mac" ? "⌘" : "Win",
    control: "Ctrl",
    alt: os === "mac" ? "⌥" : "Alt",
    shift: "Shift",
    enter: "Enter",
    escape: "Esc",
    backspace: "Backspace",
    delete: "Delete",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    " ": "Space",
  }
  const k = key.toLowerCase()
  return map[k] || key.toUpperCase()
}
