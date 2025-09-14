import { NextResponse } from "next/server";
import { withMongo } from "../../_client";

export async function POST(req: Request) {
  try {
    const { connStr, db } = await req.json();

    if (!connStr || !db) {
      return new NextResponse("Missing connection string or database", { status: 400 });
    }

    const out = await withMongo(connStr, async (client) => {
      await client.db(db).dropDatabase();
      return { success: true, message: `Database '${db}' dropped.` };
    });

    return NextResponse.json(out);
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to drop database", { status: 500 });
  }
}