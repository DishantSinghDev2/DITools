import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  const { connStr, db, collection, pipeline = [], limit = 1000 } = await req.json().catch(() => ({}))
  if (!connStr || !db || !collection) return new NextResponse("Missing fields", { status: 400 })
  if (!Array.isArray(pipeline)) return new NextResponse("pipeline must be an array", { status: 400 })
  try {
    const res = await withMongo(connStr, async (client) => {
      const cursor = client.db(db).collection(collection).aggregate(pipeline, { maxTimeMS: 15000, allowDiskUse: true })
      const docs = await cursor.limit(Math.min(Number(limit) || 1000, 10000)).toArray()
      return { docs }
    })
    return NextResponse.json(res)
  } catch (e: any) {
    return new NextResponse(e?.message || "Aggregate failed", { status: 500 })
  }
}
