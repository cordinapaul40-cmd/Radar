import { enregistrerCle, enregistrerProfil, supprimerCle } from "@/app/actions";
import { Connecteur } from "@/components/Connecteur";
import { supabaseAdmin } from "@/lib/supabase/server";
import { utilisateurCourant } from "@/lib/supabase/server";
import type { Profil } from "@/lib/types";

const MESSAGES: Record<string, string> = {
  profil: "Profil enregistré.",
  cle: "Clé API vérifiée et enregistrée.",
};

export default async function Reglages({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { ok, erreur } = await searchParams;
  const { supabase, user } = await utilisateurCourant();
  const { data } = await supabase.from("profils").select("*").maybeSingle();
  const p = data as Profil | null;
  const { data: jeton } = await supabaseAdmin()
    .from("jetons_connecteur")
    .select("user_id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <main className="narrow">
      <h1 className="titre">Réglages</h1>
      {ok && <p className="note">{MESSAGES[ok]}</p>}
      {erreur === "cle" && <p className="note err">Cette clé n&apos;a pas été acceptée par Anthropic.</p>}

      <h2 className="rub">Clé API Anthropic</h2>
      <p className="sub">
        Radar utilise ta propre clé : chaque veille est facturée sur ton compte Anthropic. Crée une clé sur{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">
          console.anthropic.com
        </a>
        . Elle est chiffrée et n&apos;est jamais réaffichée.
      </p>
      {p?.cle_api_apercu ? (
        <div className="actions">
          <span className="k">Clé enregistrée : ••••{p.cle_api_apercu}</span>
          <form action={supprimerCle}>
            <button className="ghost">Supprimer</button>
          </form>
        </div>
      ) : null}
      <form action={enregistrerCle} className="form">
        <div className="f">
          <label htmlFor="cle">{p?.cle_api_apercu ? "Remplacer la clé" : "Ta clé"}</label>
          <input id="cle" name="cle" type="password" required placeholder="sk-ant-…" autoComplete="off" />
        </div>
        <div>
          <button className="cta">Vérifier et enregistrer</button>
        </div>
      </form>

      <h2 className="rub">Connecteur Claude</h2>
      <p className="sub">
        Pour faire ta veille directement depuis ton Claude (sur ton abonnement, sans clé API) : active le
        connecteur, puis dans claude.ai ouvre Réglages &gt; Connecteurs &gt; Ajouter un connecteur personnalisé, et
        colle ton adresse. Ensuite, demande simplement à Claude « fais ma veille Radar de la semaine ».
      </p>
      <Connecteur actif={!!jeton} />

      <h2 className="rub">Ton profil</h2>
      <p className="sub">Claude s&apos;en sert pour choisir les signaux et les opportunités qui te concernent.</p>
      <form action={enregistrerProfil} className="form">
        <div className="f">
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" defaultValue={p?.nom ?? ""} placeholder={user?.email ?? ""} />
        </div>
        <div className="f">
          <label htmlFor="activite">Ton activité</label>
          <textarea id="activite" name="activite" defaultValue={p?.activite ?? ""} />
        </div>
        <div className="f">
          <label htmlFor="secteurs">Tes secteurs</label>
          <input id="secteurs" name="secteurs" defaultValue={(p?.secteurs ?? []).join(", ")} />
          <span className="hint">Séparés par des virgules.</span>
        </div>
        <div className="f">
          <label htmlFor="ambitions">Ce que tu cherches</label>
          <textarea
            id="ambitions"
            name="ambitions"
            defaultValue={p?.ambitions ?? ""}
            placeholder="Ex. de nouveaux services à lancer, des risques à anticiper"
          />
        </div>
        <div>
          <button className="cta">Enregistrer le profil</button>
        </div>
      </form>
    </main>
  );
}
