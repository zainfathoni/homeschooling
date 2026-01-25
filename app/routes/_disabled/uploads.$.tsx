import type { LoaderFunctionArgs } from "react-router";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { requireUser } from "~/utils/permissions.server";

const UPLOAD_DIR = process.env.NODE_ENV === "production" ? "/app/uploads" : "./uploads";

const MIME_TYPES: Record<string, string> = {
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUser(request);

  const filePath = params["*"];
  if (!filePath) {
    throw new Response("File not found", { status: 404 });
  }

  const fullPath = join(UPLOAD_DIR, filePath);
  
  if (!fullPath.startsWith(UPLOAD_DIR)) {
    throw new Response("Access denied", { status: 403 });
  }

  try {
    await stat(fullPath);
  } catch {
    throw new Response("File not found", { status: 404 });
  }

  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  const buffer = await readFile(fullPath);

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
