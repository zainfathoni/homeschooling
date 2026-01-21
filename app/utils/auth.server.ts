import crypto from "crypto";
import { prisma } from "./db.server";

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
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function getOrCreateUserByEmail(email: string, name?: string) {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      email,
      name: name ?? email.split("@")[0],
      role: "PARENT",
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}
