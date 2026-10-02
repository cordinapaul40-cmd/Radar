import { Logo } from "@/components/Logo";
import { envoyerLien } from "../actions";

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string; erreur?: string }>;
}) {
  const { envoye, erreur } = await searchParams;
  return (
    <main className="wrap narrow">
      <header className="mast">
        <Logo />
      </header>
      <h1 className="titre">Connexion</h1>
      <p className="sub">Pas de mot de passe : on t&apos;envoie un lien de connexion par e-mail.</p>
      {envoye && <p className="note">C&apos;est envoyé. Ouvre le lien reçu par e-mail pour entrer dans Radar.</p>}
      {erreur && <p className="note err">{erreur}</p>}
      <form action={envoyerLien} className="form">
        <div className="f">
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <button className="cta">Recevoir mon lien</button>
        </div>
      </form>
    </main>
  );
}
