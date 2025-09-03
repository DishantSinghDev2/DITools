import { NextResponse } from "next/server"
import { withMongo, safeJson } from "../../_client"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const connStr = body?.connStr || body?.connectionString
    const db = body?.db
    const collection = body?.collection

    if (!connStr || !db || !collection) {
      return NextResponse.json({ error: "connStr (or connectionString), db, collection required" }, { status: 400 })
    }

    const indexes = await withMongo(connStr, async (client) => {
      const col = client.db(db).collection(collection)
      return await col.listIndexes().toArray()
    })

    return NextResponse.json({ indexes: safeJson(indexes) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "List indexes failed" }, { status: 500 })
  }
}
