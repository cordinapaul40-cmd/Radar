import Link from "next/link";
import { GrilleSignaux } from "@/components/SignalCard";
import { utilisateurCourant } from "@/lib/supabase/server";
import type { Profil, Signal, Veille } from "@/lib/types";

export default async function MesVeilles() {
  const { supabase } = await utilisateurCourant();
  const [{ data: veilles }, { data: signaux }, { data: profil }] = await Promise.all([
    supabase.from("veilles").select("*").order("created_at"),
    supabase.from("signaux").select("*").order("date", { ascending: false }).limit(12),
    supabase.from("profils").select("*").maybeSingle(),
  ]);

  return (
    <main>
      {!(profil as Profil | null)?.cle_api_apercu && (
        <p className="note err" style={{ marginTop: 24 }}>
          Ajoute ta clé API Anthropic dans les <Link href="/app/reglages">réglages</Link> pour que tes veilles
          puissent tourner.
        </p>
      )}
      <h2 className="rub">Mes veilles</h2>
      {veilles?.length ? (
        <div className="veilles">
          {(veilles as Veille[]).map((v) => (
            <Link key={v.id} href={`/app/veilles/${v.id}`} className="veille">
              <span className="k">{v.frequence === "hebdo" ? "Chaque lundi" : "À la demande"}</span>
              <h3>{v.nom}</h3>
              <p>{v.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty">
          Tu n&apos;as pas encore de veille. <Link href="/app/veilles/nouvelle">Crée la première</Link>.
        </p>
      )}

      <h2 className="rub">Derniers signaux</h2>
      <GrilleSignaux signaux={(signaux ?? []) as Signal[]} />
    </main>
  );
}
