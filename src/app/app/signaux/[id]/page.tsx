import { notFound } from "next/navigation";
import { changerStatut } from "@/app/actions";
import { Radar } from "@/components/Radar";
import { dateFr } from "@/components/SignalCard";
import { utilisateurCourant } from "@/lib/supabase/server";
import { CATEGORIES, STATUTS, type Signal } from "@/lib/types";

const sur = (url: string) => (/^https?:\/\//.test(url) ? url : "#");

export default async function Dossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await utilisateurCourant();
  const { data } = await supabase.from("signaux").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as Signal;
  const q = s.consequences ?? {};

  return (
    <main className="narrow dossier" data-cat={s.categorie} style={{ margin: "0 auto" }}>
      <p className="k kicker" style={{ marginTop: 34 }}>
        {CATEGORIES[s.categorie]} · {dateFr(s.date)}
      </p>
      <h1 className="titre">{s.titre}</h1>
      <form action={changerStatut} className="actions">
        <input type="hidden" name="id" value={s.id} />
        <select name="statut" defaultValue={s.statut} aria-label="Statut">
          {Object.entries(STATUTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="ghost">Mettre à jour</button>
      </form>

      {s.pourquoi && (
        <div className="pull">
          <span className="k">Pourquoi c&apos;est un signal</span>
          <p>{s.pourquoi}</p>
        </div>
      )}
      {s.fait && (
        <>
          <h2>Le fait</h2>
          <p>{s.fait}</p>
        </>
      )}
      {s.signal && (
        <>
          <h2>Le signal faible</h2>
          <p>{s.signal}</p>
        </>
      )}
      {s.radar && Object.keys(s.radar).length > 0 && (
        <>
          <h2>Radar</h2>
          <Radar radar={s.radar} />
        </>
      )}
      {(q.an1 || q.an3 || q.an5) && (
        <>
          <h2>Ce qu&apos;il peut engendrer</h2>
          <div className="horizons">
            {(
              [
                ["+1 an", q.an1],
                ["+3 ans", q.an3],
                ["+5 ans", q.an5],
              ] as const
            )
              .filter(([, t]) => t)
              .map(([h, t]) => (
                <div key={h} className="hz">
                  <b>{h}</b>
                  <p>{t}</p>
                </div>
              ))}
          </div>
        </>
      )}
      {s.opportunites?.length > 0 && (
        <>
          <h2>Opportunités</h2>
          {s.opportunites.map((o) => (
            <div key={o.titre} className="opp">
              <h3>{o.titre}</h3>
              <dl>
                {o.cible && (<><dt>Cible</dt><dd>{o.cible}</dd></>)}
                {o.modele && (<><dt>Modèle</dt><dd>{o.modele}</dd></>)}
                {o.premierPas && (<><dt>1er pas</dt><dd>{o.premierPas}</dd></>)}
              </dl>
            </div>
          ))}
        </>
      )}
      {s.indicateurs?.length > 0 && (
        <>
          <h2>Indicateurs à surveiller</h2>
          <ul className="clean">
            {s.indicateurs.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      {s.sources?.length > 0 && (
        <>
          <h2>Sources</h2>
          <ul className="clean">
            {s.sources.map((x) => (
              <li key={x.url}>
                <a href={sur(x.url)} target="_blank" rel="noopener noreferrer">
                  {x.label}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
