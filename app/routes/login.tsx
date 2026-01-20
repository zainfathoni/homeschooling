import type { Route } from "./+types/login";
import { Form, useActionData, useSearchParams, redirect } from "react-router";
import { generateMagicLink } from "~/utils/auth.server";
import { getUserId } from "~/utils/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    return { error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address" };
  }

  const { url } = generateMagicLink(email);

  return { success: true, magicLinkUrl: url, email };
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Welcome to Homeschool Planner
        </h1>

        {actionData && "success" in actionData && actionData.success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                Magic link generated for <strong>{actionData.email}</strong>
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm mb-2">
                In production, this would be sent via email. For now, click below:
              </p>
              <a
                href={actionData.magicLinkUrl}
                className="block w-full bg-coral text-white text-center py-3 rounded-lg font-medium hover:bg-coral/90 transition-colors"
              >
                Click to Login
              </a>
            </div>
          </div>
        ) : (
          <Form method="post" className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent outline-none transition-shadow"
                placeholder="parent@example.com"
              />
            </div>

            {actionData && "error" in actionData && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{actionData.error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-coral text-white py-3 rounded-lg font-medium hover:bg-coral/90 transition-colors"
            >
              Send Magic Link
            </button>
          </Form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          No password needed! We'll send you a magic link to sign in.
        </p>
      </div>
    </main>
  );
}
