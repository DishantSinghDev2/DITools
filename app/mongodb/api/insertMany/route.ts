import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  const { connStr, db, collection, docs } = await req.json().catch(() => ({}))
  if (!connStr || !db || !collection || !Array.isArray(docs)) return new NextResponse("Missing fields", { status: 400 })
  if (docs.length > 10_000) return new NextResponse("Too many documents (max 10k)", { status: 413 })
  try {
    const res = await withMongo(connStr, async (client) => {
      const r = await client.db(db).collection(collection).insertMany(docs, { ordered: false })
      return { insertedCount: r.insertedCount, insertedIds: r.insertedIds }
    })
    return NextResponse.json(res)
  } catch (e: any) {
    return new NextResponse(e?.message || "InsertMany failed", { status: 500 })
  }
}
