import { NextResponse } from "next/server";
import { withMongo } from "../../_client";

export async function POST(req: Request) {
  try {
    const { connStr, db, name } = await req.json();

    if (!connStr || !db || !name) {
      return new NextResponse("Missing connection string, database, or collection name", { status: 400 });
    }

    const out = await withMongo(connStr, async (client) => {
      await client.db(db).createCollection(name);
      return { success: true, message: `Collection '${name}' created.` };
    });

    return NextResponse.json(out);
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to create collection", { status: 500 });
  }
}