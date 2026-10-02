import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Accueil() {
  return (
    <main className="wrap">
      <header className="mast">
        <div className="mast-top k">
          <span>Veille de signaux faibles</span>
          <Link href="/login">Se connecter</Link>
        </div>
        <Logo taille="big" />
        <p className="tag">Ce qui se prépare dans ton secteur, repéré chaque semaine par Claude.</p>
      </header>

      <section className="narrow">
        <h2 className="rub">Comment ça marche</h2>
        <ul className="clean" data-cat="societal">
          <li>Tu crées ton compte avec ton adresse e-mail.</li>
          <li>Tu décris ta veille : le sujet, les thèmes, les sources que tu préfères.</li>
          <li>
            Tu ajoutes ta clé API Anthropic (sur{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">
              console.anthropic.com
            </a>
            ). Claude travaille avec ta clé : tu ne paies que ce que ta veille consomme.
          </li>
          <li>
            Chaque lundi, Claude parcourt le web, repère les signaux faibles et les range dans ton radar,
            avec leurs conséquences possibles et les opportunités à saisir.
          </li>
        </ul>
        <div className="actions" style={{ marginTop: 28 }}>
          <Link href="/login" className="cta">
            Créer ma veille
          </Link>
        </div>
      </section>
    </main>
  );
}
