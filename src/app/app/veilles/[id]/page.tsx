import { notFound } from "next/navigation";
import { supprimerVeille } from "@/app/actions";
import { LancerBouton } from "@/components/LancerBouton";
import { dateFr, GrilleSignaux } from "@/components/SignalCard";
import { utilisateurCourant } from "@/lib/supabase/server";
import type { Signal, Veille } from "@/lib/types";

export default async function PageVeille({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await utilisateurCourant();
  const [{ data: veille }, { data: signaux }, { data: derniere }] = await Promise.all([
    supabase.from("veilles").select("*").eq("id", id).maybeSingle(),
    supabase.from("signaux").select("*").eq("veille_id", id).order("date", { ascending: false }),
    supabase
      .from("executions")
      .select("*")
      .eq("veille_id", id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!veille) notFound();
  const v = veille as Veille;

  return (
    <main>
      <h1 className="titre">{v.nom}</h1>
      <p className="sub">{v.description}</p>
      <p className="k">
        {v.frequence === "hebdo" ? "Chaque lundi" : "À la demande"}
        {v.derniere_execution && ` · Dernier numéro le ${dateFr(v.derniere_execution)}`}
      </p>
      {derniere?.statut === "erreur" && <p className="note err">Dernière exécution en erreur : {derniere.erreur}</p>}
      <div className="actions">
        <LancerBouton veilleId={v.id} />
        <form action={supprimerVeille}>
          <input type="hidden" name="id" value={v.id} />
          <button className="ghost">Supprimer</button>
        </form>
      </div>
      <h2 className="rub">Signaux</h2>
      <GrilleSignaux signaux={(signaux ?? []) as Signal[]} />
    </main>
  );
}
