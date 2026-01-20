import { writeFileSync } from "fs";
import { createCookieSessionStorage } from "react-router";
import type { Cookie } from "@playwright/test";
import Database from "better-sqlite3";

const sessionSecret = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const databasePath = process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db";

const sessionStorage = createCookieSessionStorage<{ userId: string }>({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: false,
    maxAge: 60 * 60 * 24 * 30,
  },
});

interface StorageState {
  cookies: Cookie[];
  origins: never[];
}

async function generateAuthFixture(
  userId: string,
  filename: string
): Promise<void> {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  const cookieHeader = await sessionStorage.commitSession(session);

  const cookieValue = cookieHeader.split(";")[0].split("=")[1];

  const storageState: StorageState = {
    cookies: [
      {
        name: "__session",
        value: cookieValue,
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ],
    origins: [],
  };

  writeFileSync(
    `e2e/fixtures/auth/${filename}`,
    JSON.stringify(storageState, null, 2) + "\n"
  );
  console.log(`✓ Generated e2e/fixtures/auth/${filename}`);
}

export async function setupAuthFixtures(): Promise<void> {
  const db = new Database(databasePath);
  const parent = db.prepare("SELECT id FROM User WHERE email = ?").get("zain@example.com") as { id: string } | undefined;
  db.close();

  if (parent) {
    await generateAuthFixture(parent.id, "parent.local.json");
  } else {
    console.warn("Parent user not found in database - run `npx prisma db seed` first");
  }
}
