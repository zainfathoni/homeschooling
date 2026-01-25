import crypto from "crypto";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { db } from "./db.server";
import { users } from "../db/schema";

type MagicLink = {
  token: string;
  email: string;
  expiresAt: Date;
};

const magicLinks = new Map<string, MagicLink>();

const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export function generateMagicLink(email: string): { token: string; url: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);

  magicLinks.set(token, { token, email, expiresAt });

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/magic?token=${token}`;

  return { token, url };
}

export function verifyMagicLink(token: string): { valid: true; email: string } | { valid: false; error: string } {
  const link = magicLinks.get(token);

  if (!link) {
    return { valid: false, error: "Invalid magic link" };
  }

  if (link.expiresAt < new Date()) {
    magicLinks.delete(token);
    return { valid: false, error: "Magic link has expired" };
  }

  magicLinks.delete(token);
  return { valid: true, email: link.email };
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function getOrCreateUserByEmail(email: string, name?: string) {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      id: createId(),
      email,
      name: name ?? email.split("@")[0],
      role: "PARENT",
    })
    .returning();

  return newUser;
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}
