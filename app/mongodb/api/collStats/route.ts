import { NextResponse } from "next/server"
import { withMongo, safeJson } from "../_client"

export async function POST(req: Request) {
  const { connStr, db, collection } = await req.json().catch(() => ({}))
  if (!connStr || !db || !collection) return new NextResponse("Missing connStr, db or collection", { status: 400 })
  try {
    const out = await withMongo(connStr, async (client) => {
      const stats = await client.db(db).command({ collStats: collection, scale: 1 })
      return safeJson(stats)
    })
    return NextResponse.json(out)
  } catch (e: any) {
    return new NextResponse(e?.message || "collStats failed", { status: 500 })
  }
}
