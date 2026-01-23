import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import * as relations from "../db/relations";

// Combine schema and relations for full type inference
const fullSchema = { ...schema, ...relations };

let db: ReturnType<typeof createDrizzleClient>;

declare global {
  var __db__: ReturnType<typeof createDrizzleClient> | undefined;
}

function createDrizzleClient() {
  const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
  // better-sqlite3 expects path without "file:" prefix
  const dbPath = connectionString.replace(/^file:/, "");
  const sqlite = new Database(dbPath);
  return drizzle(sqlite, { schema: fullSchema });
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  db = createDrizzleClient();
} else {
  if (!global.__db__) {
    global.__db__ = createDrizzleClient();
  }
  db = global.__db__;
}

export { db };
