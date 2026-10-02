"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { chiffrer } from "@/lib/chiffrement";
import { supabaseAdmin, supabaseServeur, utilisateurCourant } from "@/lib/supabase/server";
import { verifierCle } from "@/lib/veille";

const liste = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export async function envoyerLien(formData: FormData) {
  const supabase = await supabaseServeur();
  const email = String(formData.get("email") ?? "").trim();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  redirect(error ? `/login?erreur=${encodeURIComponent(error.message)}` : "/login?envoye=1");
}

export async function deconnexion() {
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
  redirect("/");
}

export async function enregistrerProfil(formData: FormData) {
  const { supabase, user } = await utilisateurCourant();
  if (!user) redirect("/login");
  await supabase
    .from("profils")
    .update({
      nom: String(formData.get("nom") ?? ""),
      activite: String(formData.get("activite") ?? ""),
      secteurs: liste(formData.get("secteurs")),
      ambitions: String(formData.get("ambitions") ?? ""),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  revalidatePath("/app/reglages");
  redirect("/app/reglages?ok=profil");
}

export async function enregistrerCle(formData: FormData) {
  const { supabase, user } = await utilisateurCourant();
  if (!user) redirect("/login");
  const cle = String(formData.get("cle") ?? "").trim();
  try {
    await verifierCle(cle);
  } catch {
    redirect("/app/reglages?erreur=cle");
  }
  await supabaseAdmin()
    .from("cles_api")
    .upsert({ user_id: user.id, chiffree: chiffrer(cle), updated_at: new Date().toISOString() });
  await supabase.from("profils").update({ cle_api_apercu: cle.slice(-4) }).eq("user_id", user.id);
  revalidatePath("/app/reglages");
  redirect("/app/reglages?ok=cle");
}

export async function supprimerCle() {
  const { supabase, user } = await utilisateurCourant();
  if (!user) redirect("/login");
  await supabaseAdmin().from("cles_api").delete().eq("user_id", user.id);
  await supabase.from("profils").update({ cle_api_apercu: null }).eq("user_id", user.id);
  revalidatePath("/app/reglages");
}

export async function creerVeille(formData: FormData) {
  const { supabase, user } = await utilisateurCourant();
  if (!user) redirect("/login");
  const { data, error } = await supabase
    .from("veilles")
    .insert({
      user_id: user.id,
      nom: String(formData.get("nom") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      themes: liste(formData.get("themes")),
      sources_preferees: liste(formData.get("sources")),
      langue: formData.get("langue") === "en" ? "en" : "fr",
      frequence: formData.get("frequence") === "manuelle" ? "manuelle" : "hebdo",
    })
    .select("id")
    .single();
  if (error) redirect(`/app/veilles/nouvelle?erreur=${encodeURIComponent(error.message)}`);
  redirect(`/app/veilles/${data.id}`);
}

export async function supprimerVeille(formData: FormData) {
  const { supabase } = await utilisateurCourant();
  await supabase.from("veilles").delete().eq("id", String(formData.get("id")));
  redirect("/app");
}

export async function changerStatut(formData: FormData) {
  const { supabase } = await utilisateurCourant();
  const id = String(formData.get("id"));
  await supabase.from("signaux").update({ statut: String(formData.get("statut")) }).eq("id", id);
  revalidatePath(`/app/signaux/${id}`);
}
