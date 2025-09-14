import { NextResponse } from "next/server";
import { withMongo } from "../../_client";

export async function POST(req: Request) {
  try {
    const { connStr, db, coll } = await req.json();

    if (!connStr || !db || !coll) {
      return new NextResponse("Missing connection string, database, or collection", { status: 400 });
    }

    const out = await withMongo(connStr, async (client) => {
      await client.db(db).dropCollection(coll);
      return { success: true, message: `Collection '${coll}' dropped.` };
    });

    return NextResponse.json(out);
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to drop collection", { status: 500 });
  }
}