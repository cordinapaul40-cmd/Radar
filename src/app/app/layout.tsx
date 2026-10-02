import Link from "next/link";
import { Logo } from "@/components/Logo";
import { deconnexion } from "../actions";

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      <header className="mast">
        <Logo />
        <nav className="sections">
          <Link href="/app">Mes veilles</Link>
          <Link href="/app/veilles/nouvelle">Nouvelle veille</Link>
          <Link href="/app/reglages">Réglages</Link>
          <form action={deconnexion}>
            <button>Déconnexion</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
