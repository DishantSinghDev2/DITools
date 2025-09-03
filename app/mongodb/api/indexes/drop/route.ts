import { NextResponse } from "next/server"
import { withMongo } from "../../_client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { connectionString, db, collection, name } = body || {}
    if (!connectionString || !db || !collection || !name) {
      return NextResponse.json({ error: "connectionString, db, collection, name required" }, { status: 400 })
    }
    const res = await withMongo(connectionString, async (client) => {
      const col = client.db(db).collection(collection)
      const ok = await col.dropIndex(name)
      return { ok }
    })
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Drop index failed" }, { status: 500 })
  }
}
