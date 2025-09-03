import { MongoClient } from "mongodb"

export async function withMongo<T>(connStr: string, fn: (client: MongoClient) => Promise<T>): Promise<T> {
  const client = new MongoClient(connStr, {
    retryWrites: true,
    // @ts-ignore
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 6_000,
    socketTimeoutMS: 15_000,
  })
  try {
    await client.connect()
    return await fn(client)
  } finally {
    try {
      await client.close()
    } catch {
      // ignore
    }
  }
}

/**
 * Converts MongoDB/BSON values to JSON-safe primitives recursively.
 * - ObjectId -> hex string
 * - Decimal128/Long/Int32/Double -> string or number
 * - Date -> ISO string
 * - Binary/Uint8Array -> base64 string
 * - BigInt -> string
 * - Prevents circular refs by dropping repeated objects
 */
export function safeJson(input: any): any {
  const seen = new WeakSet()

  function toBase64(u8: Uint8Array): string {
    try {
      // Node environment
      // @ts-ignore
      return Buffer.from(u8).toString("base64")
    } catch {
      // Fallback (unlikely on server)
      let binary = ""
      const chunk = 0x8000
      for (let i = 0; i < u8.length; i += chunk) {
        binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk) as any)
      }
      // @ts-ignore
      return btoa(binary)
    }
  }

  function serialize(value: any): any {
    if (value === null || value === undefined) return value
    const t = typeof value
    if (t === "string" || t === "number" || t === "boolean") return value
    if (t === "bigint") return value.toString()

    // Dates
    if (value instanceof Date) return value.toISOString()

    // Arrays
    if (Array.isArray(value)) return value.map(serialize)

    // BSON-like types via _bsontype discriminator
    const bs = value?._bsontype
    if (bs === "ObjectId" && typeof value.toHexString === "function") return value.toHexString()
    if (bs === "Decimal128" && typeof value.toString === "function") return value.toString()
    if (bs === "Long" && typeof value.toString === "function") return value.toString()
    if (bs === "Double" && typeof value.valueOf === "function") return Number(value.valueOf())
    if (bs === "Int32" && typeof value.valueOf === "function") return Number(value.valueOf())
    if (bs === "Timestamp" && typeof value.toString === "function") return value.toString()
    if (bs === "UUID" && typeof value.toString === "function") return value.toString()
    if (bs === "Binary") {
      // Mongo Binary has .buffer or .value()
      const bytes: Uint8Array | undefined =
        typeof value.buffer === "object" ? value.buffer : typeof value.value === "function" ? value.value() : undefined
      if (bytes && bytes instanceof Uint8Array) return toBase64(bytes)
    }

    // Raw binary
    if (value instanceof Uint8Array) return toBase64(value)

    // Prevent cycles
    if (typeof value === "object") {
      if (seen.has(value)) return null
      seen.add(value)
      const out: Record<string, any> = {}
      for (const k of Object.keys(value)) {
        out[k] = serialize(value[k])
      }
      return out
    }

    // Fallback to string
    try {
      return JSON.parse(JSON.stringify(value))
    } catch {
      return String(value)
    }
  }

  return serialize(input)
}
