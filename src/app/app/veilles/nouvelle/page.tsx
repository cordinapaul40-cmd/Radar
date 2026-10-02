import { creerVeille } from "@/app/actions";

export default async function NouvelleVeille({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <main className="narrow">
      <h1 className="titre">Nouvelle veille</h1>
      <p className="sub">Décris ce que tu veux surveiller, comme tu l&apos;expliquerais à un analyste.</p>
      {erreur && <p className="note err">{erreur}</p>}
      <form action={creerVeille} className="form">
        <div className="f">
          <label htmlFor="nom">Nom</label>
          <input id="nom" name="nom" required placeholder="Ex. Restauration dans les Landes" />
        </div>
        <div className="f">
          <label htmlFor="description">Sujet</label>
          <textarea
            id="description"
            name="description"
            required
            placeholder="Ex. Les nouvelles habitudes de consommation dans les cafés, hôtels et restaurants du Sud-Ouest, et ce qui peut changer le métier de restaurateur."
          />
        </div>
        <div className="f">
          <label htmlFor="themes">Thèmes</label>
          <input id="themes" name="themes" placeholder="tourisme, emploi, réglementation" />
          <span className="hint">Séparés par des virgules.</span>
        </div>
        <div className="f">
          <label htmlFor="sources">Sources à privilégier</label>
          <input id="sources" name="sources" placeholder="sudouest.fr, lechotouristique.com" />
          <span className="hint">Facultatif, séparées par des virgules.</span>
        </div>
        <div className="two">
          <div className="f">
            <label htmlFor="frequence">Fréquence</label>
            <select id="frequence" name="frequence" defaultValue="hebdo">
              <option value="hebdo">Chaque lundi</option>
              <option value="manuelle">Seulement quand je la lance</option>
            </select>
          </div>
          <div className="f">
            <label htmlFor="langue">Langue</label>
            <select id="langue" name="langue" defaultValue="fr">
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </div>
        </div>
        <div>
          <button className="cta">Créer la veille</button>
        </div>
      </form>
    </main>
  );
}
