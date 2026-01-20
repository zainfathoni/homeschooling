import type { Route } from "./+types/magic";
import { redirect } from "react-router";
import { verifyMagicLink, getOrCreateUserByEmail } from "~/utils/auth.server";
import { createUserSession } from "~/utils/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectTo = url.searchParams.get("redirectTo") ?? "/";

  if (!token) {
    return redirect("/login?error=missing-token");
  }

  const result = verifyMagicLink(token);

  if (!result.valid) {
    const errorParam = encodeURIComponent(result.error);
    return redirect(`/login?error=${errorParam}`);
  }

  const user = await getOrCreateUserByEmail(result.email);
  return createUserSession(user.id, redirectTo);
}

export default function MagicLinkPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg text-center">
        <div className="animate-pulse">
          <p className="text-gray-600">Verifying your magic link...</p>
        </div>
      </div>
    </main>
  );
}
