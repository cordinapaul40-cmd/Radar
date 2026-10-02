"use client";

import { useActionState } from "react";
import { genererJeton, supprimerJeton } from "@/app/actions";

export function Connecteur({ actif }: { actif: boolean }) {
  const [etat, generer, enCours] = useActionState(() => genererJeton(), {});

  return (
    <>
      {etat.adresse ? (
        <div className="note">
          <p style={{ margin: "0 0 8px" }}>
            Ton adresse personnelle (affichée une seule fois, garde-la pour toi) :
          </p>
          <input readOnly value={etat.adresse} onFocus={(e) => e.currentTarget.select()} style={{ width: "100%" }} />
        </div>
      ) : (
        actif && <p className="k">Connecteur activé.</p>
      )}
      {etat.erreur && <p className="note err">{etat.erreur}</p>}
      <div className="actions">
        <form action={generer}>
          <button className="cta" disabled={enCours}>
            {actif ? "Générer une nouvelle adresse" : "Activer le connecteur"}
          </button>
        </form>
        {actif && (
          <form action={supprimerJeton}>
            <button className="ghost">Désactiver</button>
          </form>
        )}
      </div>
    </>
  );
}
