import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../../generated/prisma");

type PrismaClientType = InstanceType<typeof PrismaClient>;
let prisma: PrismaClientType;

declare global {
  var __db__: PrismaClientType | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  return new PrismaClient({ adapter });
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = createPrismaClient();
  }
  prisma = global.__db__;
}

export { prisma };
