import { MongoClient } from "mongodb";

// Connection pooling
const clients: { [key: string]: { client: MongoClient; timestamp: number } } = {};
const CLIENT_TTL = 1000 * 60 * 5; // 5 minutes

export async function withMongo<T>(
  connStr: string,
  callback: (client: MongoClient) => Promise<T>
): Promise<T> {
  let cached = clients[connStr];
  if (cached && Date.now() - cached.timestamp < CLIENT_TTL) {
    cached.timestamp = Date.now(); // Refresh timestamp
    return await callback(cached.client);
  }

  // Close expired connection if it exists
  if (cached) {
    await cached.client.close().catch(console.error);
  }

  const client = new MongoClient(connStr, {
    serverSelectionTimeoutMS: 5000, // Fail fast if server is not available
  });

  try {
    await client.connect();
    clients[connStr] = { client, timestamp: Date.now() };
    return await callback(client);
  } catch (error) {
    await client.close().catch(console.error); // Ensure client is closed on connection error
    delete clients[connStr];
    throw error;
  }
}

// Safely stringify JSON with BigInt and other special types support
export function safeJson(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}