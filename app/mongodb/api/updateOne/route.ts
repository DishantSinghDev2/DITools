import { NextResponse } from "next/server"
import { withMongo } from "../_client"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  const { connStr, db, collection, filter = {}, update = {}, upsert = false } = await req.json().catch(() => ({}))
  
  if (!connStr || !db || !collection) return new NextResponse("Missing fields", { status: 400 })
  
  try {
    // If querying by _id, ensure it is converted to ObjectId if it's a valid hex string
    if (filter._id && typeof filter._id === "string" && ObjectId.isValid(filter._id)) {
       filter._id = new ObjectId(filter._id)
    }

    const res = await withMongo(connStr, async (client) => {
      const r = await client.db(db).collection(collection).updateOne(filter, update, { upsert })
      return { matchedCount: r.matchedCount, modifiedCount: r.modifiedCount, upsertedId: r.upsertedId }
    })
    
    return NextResponse.json(res)
  } catch (e: any) {
    return new NextResponse(e?.message || "UpdateOne failed", { status: 500 })
  }
}