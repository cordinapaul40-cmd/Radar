import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Client lié à la session de l'utilisateur : soumis aux règles RLS.
export async function supabaseServeur() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (aEcrire) => {
          try {
            aEcrire.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component : le proxy rafraîchit la session.
          }
        },
      },
    },
  );
}

// Client administrateur (service role) : uniquement côté serveur,
// pour la clé API chiffrée et la veille hebdomadaire automatique.
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function utilisateurCourant() {
  const supabase = await supabaseServeur();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
