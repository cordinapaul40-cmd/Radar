import { dechiffrer } from "./chiffrement";
import { supabaseAdmin } from "./supabase/server";
import type { Profil, Veille } from "./types";
import { lancerVeille } from "./veille";

// Exécute une veille et enregistre ses signaux. Utilisé par le bouton
// « Lancer maintenant » et par la tâche hebdomadaire.
export async function executerVeille(veille: Veille) {
  const admin = supabaseAdmin();
  const { data: execution } = await admin
    .from("executions")
    .insert({ veille_id: veille.id, user_id: veille.user_id })
    .select()
    .single();

  try {
    const [{ data: cle }, { data: profil }, { data: recents }] = await Promise.all([
      admin.from("cles_api").select("chiffree").eq("user_id", veille.user_id).maybeSingle(),
      admin.from("profils").select("*").eq("user_id", veille.user_id).maybeSingle(),
      admin
        .from("signaux")
        .select("titre")
        .eq("veille_id", veille.id)
        .order("date", { ascending: false })
        .limit(40),
    ]);
    if (!cle) throw new Error("Aucune clé API Anthropic enregistrée dans les réglages.");

    const signaux = await lancerVeille({
      cleApi: dechiffrer(cle.chiffree),
      veille,
      profil: profil as Profil | null,
      dejaVus: (recents ?? []).map((r) => r.titre),
    });

    if (signaux.length) {
      const { error } = await admin.from("signaux").insert(
        signaux.map((s) => ({ ...s, veille_id: veille.id, user_id: veille.user_id, execution_id: execution?.id })),
      );
      if (error) throw error;
    }
    const fin = new Date().toISOString();
    await admin.from("veilles").update({ derniere_execution: fin }).eq("id", veille.id);
    await admin
      .from("executions")
      .update({ statut: "ok", nb_signaux: signaux.length, finished_at: fin })
      .eq("id", execution?.id);
    return { ok: true as const, nb: signaux.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin
      .from("executions")
      .update({ statut: "erreur", erreur: message, finished_at: new Date().toISOString() })
      .eq("id", execution?.id);
    return { ok: false as const, erreur: message };
  }
}
