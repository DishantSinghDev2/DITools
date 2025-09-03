import { NextResponse } from "next/server"
import { withMongo, safeJson } from "../../_client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { connectionString, db, collection, keys, options } = body || {}
    if (!connectionString || !db || !collection) {
      return NextResponse.json({ error: "connectionString, db, collection required" }, { status: 400 })
    }
    const k = safeJson(keys) ?? keys
    const op = safeJson(options) ?? options
    if (!k || typeof k !== "object") return NextResponse.json({ error: "keys object required" }, { status: 400 })

    const res = await withMongo(connectionString, async (client) => {
      const col = client.db(db).collection(collection)
      const name = await col.createIndex(k as any, op as any)
      return { name }
    })
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Create index failed" }, { status: 500 })
  }
}
