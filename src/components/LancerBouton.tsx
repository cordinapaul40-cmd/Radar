"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LancerBouton({ veilleId }: { veilleId: string }) {
  const router = useRouter();
  const [etat, setEtat] = useState<"repos" | "en_cours" | "erreur">("repos");
  const [message, setMessage] = useState("");

  async function lancer() {
    setEtat("en_cours");
    setMessage("");
    const res = await fetch(`/api/veilles/${veilleId}/run`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEtat("repos");
      setMessage(`${data.nb} nouveau(x) signal(aux).`);
      router.refresh();
    } else {
      setEtat("erreur");
      setMessage(data.erreur ?? "La veille a échoué.");
    }
  }

  return (
    <>
      <button className="cta" onClick={lancer} disabled={etat === "en_cours"}>
        {etat === "en_cours" ? "Claude cherche… (quelques minutes)" : "Lancer la veille maintenant"}
      </button>
      {message && <span className={etat === "erreur" ? "k" : "sub"}>{message}</span>}
    </>
  );
}
