// Utility to deeply redact possible secrets in any JSON-like payload.
// Masks values for keys like password, token, apiKey, key, secret, authorization, cookie, etc.,
// and also masks credentials within URIs like mongodb+srv://user:pass@host/db.

const SECRET_KEY_REGEX =
  /(pass(word)?|pwd|secret|token|api[-_]?key|access[-_]?key|private[-_]?key|client[-_]?secret|authorization|auth|cookie|set-cookie|session|jwt|bearer)/i

const POSSIBLE_SECRET_VALUE =
  // Long base64/hex-ish strings or JWT-like tokens
  /(^[A-Za-z0-9-_]{20,}$)|(^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$)|(^[A-Fa-f0-9]{24,}$)/

export function redactConnectionString(input: string): string {
  try {
    const u = new URL(input)
    if (u.username || u.password) {
      const username = u.username ? "***" : ""
      const password = u.password ? "*****" : ""
      const auth = u.username || u.password ? `${username}${u.password ? ":" + password : ""}@` : ""
      return `${u.protocol}//${auth}${u.host}${u.pathname}${u.search}${u.hash}`
    }
    return input
  } catch {
    // Not a valid URL; try manual masking for mongo connection strings
    return input.replace(/(mongodb(\+srv)?:\/\/)([^:@]+)(:[^@]+)?@/i, (_m, p1) => `${p1}***:*****@`)
  }
}

function shouldRedactKey(key: string): boolean {
  return SECRET_KEY_REGEX.test(key)
}

function shouldRedactValue(value: unknown): boolean {
  if (typeof value !== "string") return false
  return POSSIBLE_SECRET_VALUE.test(value)
}

function mask(value: unknown): string {
  if (typeof value === "string" && value.length > 0) {
    const visiblePrefix = Math.min(2, value.length)
    return `${value.slice(0, visiblePrefix)}*****[REDACTED]`
  }
  return "*****[REDACTED]"
}

export function redactObjectDeep(input: any, keyPath: string[] = []): any {
  if (input == null) return input

  if (typeof input === "string") {
    if (shouldRedactValue(input)) return mask(input)
    return redactConnectionString(input)
  }

  if (Array.isArray(input)) {
    return input.map((v, idx) => redactObjectDeep(v, keyPath.concat(String(idx))))
  }

  if (typeof input === "object") {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(input)) {
      if (shouldRedactKey(k)) {
        out[k] = mask(typeof v === "string" ? redactConnectionString(v) : v)
      } else if (typeof v === "string") {
        if (shouldRedactValue(v)) out[k] = mask(v)
        else out[k] = redactConnectionString(v)
      } else {
        out[k] = redactObjectDeep(v, keyPath.concat(k))
      }
    }
    return out
  }

  return input
}

// High-level helper used by both client and server before any AI call
export function redactPayloadForAI(payload: any): any {
  if (!payload) return payload
  const cloned = JSON.parse(JSON.stringify(payload))
  // Hard-remove known top-level sensitive fields if present
  delete cloned.connectionString
  delete cloned.headers
  delete cloned.cookies
  delete cloned.authorization
  delete cloned.token
  delete cloned.apiKey
  delete cloned.privateKey
  return redactObjectDeep(cloned)
}
