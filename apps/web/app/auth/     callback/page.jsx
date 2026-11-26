
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    );
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/";

  // Email verification callback will be completed
  // with the Supabase server-side authentication client.

  return NextResponse.redirect(
    `${origin}/login?error=callback_setup_required&next=${encodeURIComponent(safeNext)}`
  );
}
