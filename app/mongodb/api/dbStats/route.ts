import { NextResponse } from "next/server"
import { withMongo, safeJson } from "../_client"

export async function POST(req: Request) {
  const { connStr, db } = await req.json().catch(() => ({}))
  if (!connStr || !db) return new NextResponse("Missing connStr or db", { status: 400 })
  try {
    const out = await withMongo(connStr, async (client) => {
      const stats = await client.db(db).command({ dbStats: 1, scale: 1 })
      return safeJson(stats)
    })
    return NextResponse.json(out)
  } catch (e: any) {
    return new NextResponse(e?.message || "dbStats failed", { status: 500 })
  }
}
