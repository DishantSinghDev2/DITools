import { NextResponse } from "next/server"
import { withMongo } from "../_client"
import { safeJson } from "../_client"

export async function POST(req: Request) {
  const {
    connStr,
    db,
    coll,
    filter = {},
    projection = {},
    sort = {},
    limit = 100,
    skip = 0,
  } = await req.json().catch(() => ({}))
  if (!connStr || !db || !coll) return new NextResponse("Missing connStr, db or coll", { status: 400 })
  try {
    const out = await withMongo(connStr, async (client) => {
      const collection = client.db(db).collection(coll)
      const cursor = collection.find(filter, {
        projection,
        sort,
        skip,
        limit: Math.min(Number(limit) || 100, 5000),
        maxTimeMS: 15000,
      })
      const docs = await cursor.toArray()
      return { docs: safeJson(docs) }
    })
    return NextResponse.json(out)
  } catch (e: any) {
    return new NextResponse(e?.message || "Find failed", { status: 500 })
  }
}
