import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  const { connStr } = await req.json().catch(() => ({}))
  if (!connStr || typeof connStr !== "string") return new NextResponse("Missing connStr", { status: 400 })
  try {
    const result = await withMongo(connStr, async (client) => {
      const admin = client.db().admin()
      const dbs = await admin.listDatabases()
      return {
        databases: dbs.databases
          .map((d: any) => d.name)
          .filter((n: string) => !["local", "config", "admin"].includes(n))
          .sort(),
      }
    })
    return NextResponse.json(result)
  } catch (e: any) {
    return new NextResponse(e?.message || "Connection failed", { status: 500 })
  }
}
