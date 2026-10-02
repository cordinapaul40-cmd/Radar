import { NextResponse, type NextRequest } from "next/server";
import { supabaseServeur } from "@/lib/supabase/server";

// Retour du lien magique envoyé par e-mail.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServeur();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/app", request.url));
}
