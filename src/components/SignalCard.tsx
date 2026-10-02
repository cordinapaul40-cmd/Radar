import Link from "next/link";
import { CATEGORIES, STATUTS, type Signal } from "@/lib/types";

export function dateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function Statut({ statut }: { statut: Signal["statut"] }) {
  return (
    <span className="pill" style={{ ["--st" as string]: `var(--s-${statut})` }}>
      {STATUTS[statut]}
    </span>
  );
}

export function SignalCard({ s }: { s: Signal }) {
  return (
    <Link href={`/app/signaux/${s.id}`} className="card" data-cat={s.categorie}>
      <div className="row">
        <span className="k kicker">{CATEGORIES[s.categorie]}</span>
        <span className="k">{dateFr(s.date)}</span>
      </div>
      <h3>{s.titre}</h3>
      {s.synthese && <p>{s.synthese}</p>}
      <Statut statut={s.statut} />
    </Link>
  );
}

export function GrilleSignaux({ signaux }: { signaux: Signal[] }) {
  if (!signaux.length) return <p className="empty">Aucun signal pour l&apos;instant.</p>;
  return (
    <div className="grid">
      {signaux.map((s) => (
        <SignalCard key={s.id} s={s} />
      ))}
    </div>
  );
}
