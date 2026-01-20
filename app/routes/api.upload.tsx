import type { ActionFunctionArgs } from "react-router";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  requireUser,
  getActiveStudentId,
  requireStudentAccess,
} from "~/utils/permissions.server";

const UPLOAD_DIR = "/data/homeschool/uploads";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_VOICE_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"];
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const studentIdParam = formData.get("studentId") as string | null;

  if (!file || !(file instanceof File)) {
    return new Response("No file provided", { status: 400 });
  }

  if (!type || !["VOICE", "PHOTO"].includes(type)) {
    return new Response("Invalid file type. Must be VOICE or PHOTO", { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`, { status: 400 });
  }

  const allowedTypes = type === "VOICE" ? ALLOWED_VOICE_TYPES : ALLOWED_PHOTO_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return new Response(`Invalid file format. Allowed: ${allowedTypes.join(", ")}`, { status: 400 });
  }

  const studentId = studentIdParam ?? (await getActiveStudentId(request, user));
  if (!studentId) {
    return new Response("No student selected", { status: 400 });
  }

  await requireStudentAccess(user, studentId);

  const studentDir = join(UPLOAD_DIR, studentId);
  const typeDir = join(studentDir, type.toLowerCase());

  if (!existsSync(typeDir)) {
    await mkdir(typeDir, { recursive: true });
  }

  const timestamp = Date.now();
  const extension = getExtension(file.type, type);
  const filename = `${timestamp}-${crypto.randomUUID()}${extension}`;
  const filePath = join(typeDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const relativePath = filePath.replace(UPLOAD_DIR, "").replace(/^\//, "");

  return { success: true, filePath: relativePath, fullPath: filePath };
}

function getExtension(mimeType: string, type: string): string {
  const mimeToExt: Record<string, string> = {
    "audio/webm": ".webm",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return mimeToExt[mimeType] || (type === "VOICE" ? ".webm" : ".jpg");
}
