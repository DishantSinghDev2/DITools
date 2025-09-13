// File: app/mongodb/api/count/route.ts

import { NextResponse } from "next/server"
import { withMongo } from "../_client"

export async function POST(req: Request) {
  try {
    const { connStr, db, coll, filter = {} } = await req.json()

    if (!connStr || !db || !coll) {
      return new NextResponse("Missing connection string, database, or collection", { status: 400 })
    }

    const out = await withMongo(connStr, async (client) => {
      const collection = client.db(db).collection(coll)
      
      // Use countDocuments for an efficient count based on the filter
      const count = await collection.countDocuments(filter, {
        maxTimeMS: 15000, // Set a reasonable timeout
      })

      return { count }
    })

    return NextResponse.json(out)
  } catch (e: any) {
    console.error("Count API Error:", e)
    return new NextResponse(e?.message || "Failed to count documents", { status: 500 })
  }
}