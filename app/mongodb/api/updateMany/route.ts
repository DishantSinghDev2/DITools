import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  const { connStr, db, collection, filter = {}, update = {}, upsert = false } = await req.json().catch(() => ({}))
  if (!connStr || !db || !collection) return new NextResponse("Missing fields", { status: 400 })
  try {
    const res = await withMongo(connStr, async (client) => {
      const r = await client.db(db).collection(collection).updateMany(filter, update, { upsert })
      return { matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId: r.upsertedId }
    })
    return NextResponse.json(res)
  } catch (e: any) {
    return new NextResponse(e?.message || "UpdateMany failed", { status: 500 })
  }
}
