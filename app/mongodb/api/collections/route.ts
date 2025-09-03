import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  const { connStr, db } = await req.json().catch(() => ({}))
  if (!connStr || !db) return new NextResponse("Missing connStr or db", { status: 400 })
  try {
    const result = await withMongo(connStr, async (client) => {
      const list = await client.db(db).listCollections().toArray()
      return { collections: list.map((c: any) => c.name).sort() }
    })
    return NextResponse.json(result)
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to list collections", { status: 500 })
  }
}
