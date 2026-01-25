import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../db/schema";
import * as relations from "../db/relations";

const fullSchema = { ...schema, ...relations };

let db: ReturnType<typeof createDrizzleClient>;

declare global {
  var __db__: ReturnType<typeof createDrizzleClient> | undefined;
}

function createDrizzleClient() {
  const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
  const client = createClient({ url: connectionString });
  return drizzle(client, { schema: fullSchema });
}

if (process.env.NODE_ENV === "production") {
  db = createDrizzleClient();
} else {
  if (!global.__db__) {
    global.__db__ = createDrizzleClient();
  }
  db = global.__db__;
}

export { db };
