/**
 * URL helpers for student selection via query parameters.
 *
 * Student selection is determined by the `?student=:studentId` query parameter.
 * This enables shareable links, proper browser navigation, and avoids cookie-based
 * revalidation issues (especially on WebKit/Linux).
 */

/**
 * Get the student ID from a URL's search params.
 */
export function getStudentIdFromUrl(url: URL | string): string | null {
  const urlObj = typeof url === "string" ? new URL(url) : url;
  return urlObj.searchParams.get("student");
}

/**
 * Get the student ID from a Request's URL.
 */
export function getStudentIdFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  return getStudentIdFromUrl(url);
}

/**
 * Build a URL path with the student query parameter.
 *
 * @param path - The base path (e.g., "/week/2024-01-15")
 * @param studentId - The student ID to include (optional)
 * @returns The path with student param if provided
 */
export function buildStudentUrl(
  path: string,
  studentId: string | null | undefined
): string {
  if (!studentId) {
    return path;
  }

  // Parse existing path to handle any existing query params
  const hasQuery = path.includes("?");
  const separator = hasQuery ? "&" : "?";

  return `${path}${separator}student=${studentId}`;
}

/**
 * Preserve the student parameter when building navigation links.
 *
 * @param path - The target path
 * @param currentUrl - The current URL (to extract student param from)
 * @returns The path with student param preserved if present
 */
export function preserveStudentParam(path: string, currentUrl: URL): string {
  const studentId = getStudentIdFromUrl(currentUrl);
  return buildStudentUrl(path, studentId);
}

/**
 * Update the URL to include a new student ID, preserving other params.
 *
 * @param currentUrl - The current URL
 * @param newStudentId - The new student ID to set
 * @returns The new URL with updated student param
 */
export function updateStudentInUrl(currentUrl: URL, newStudentId: string): URL {
  const newUrl = new URL(currentUrl);
  newUrl.searchParams.set("student", newStudentId);
  return newUrl;
}
