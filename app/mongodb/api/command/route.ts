import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  const { connStr, db, command = {} } = await req.json().catch(() => ({}))
  if (!connStr || !db) return new NextResponse("Missing fields", { status: 400 })
  try {
    const res = await withMongo(connStr, async (client) => {
      const out = await client.db(db).command(command)
      return out
    })
    return NextResponse.json(res)
  } catch (e: any) {
    return new NextResponse(e?.message || "Command failed", { status: 500 })
  }
}
