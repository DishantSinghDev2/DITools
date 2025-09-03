import { NextResponse } from "next/server"
import { withMongo, safeJson } from "../_client"

export async function POST(req: Request) {
  const { connStr } = await req.json().catch(() => ({}))
  if (!connStr) return new NextResponse("Missing connStr", { status: 400 })
  try {
    const out = await withMongo(connStr, async (client) => {
      const adminDb = client.db("admin")
      const buildInfo = await adminDb.command({ buildInfo: 1 })
      let hello: any = {}
      try {
        hello = await adminDb.command({ hello: 1 })
      } catch {
        // hello may be restricted
      }
      return safeJson({ buildInfo, hello })
    })
    return NextResponse.json({ buildInfo: out.buildInfo, hello: out.hello })
  } catch (e: any) {
    return new NextResponse(e?.message || "serverInfo failed", { status: 500 })
  }
}
