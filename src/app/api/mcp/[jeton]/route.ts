import { empreinte } from "@/lib/jeton";
import { serveurPour } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";

// Connecteur Claude : chacun l'ajoute dans claude.ai (Réglages > Connecteurs)
// avec son adresse personnelle https://<site>/api/mcp/<jeton>. C'est alors son
// propre Claude, sur son abonnement, qui fait la recherche et range les signaux ici.

async function gerer(request: Request, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("jetons_connecteur")
    .select("user_id")
    .eq("empreinte", empreinte(jeton))
    .maybeSingle();
  if (!data) return new Response("Jeton de connecteur inconnu.", { status: 401 });
  await admin.from("jetons_connecteur").update({ dernier_usage: new Date().toISOString() }).eq("user_id", data.user_id);
  return serveurPour(data.user_id)(request);
}

export { gerer as GET, gerer as POST, gerer as DELETE };
