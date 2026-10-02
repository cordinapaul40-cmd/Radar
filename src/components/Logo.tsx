import Link from "next/link";

export function Logo({ taille = "small" }: { taille?: "small" | "big" }) {
  return (
    <Link href="/" className={`logo ${taille}`}>
      Radar<span className="dot" aria-hidden="true" />
    </Link>
  );
}
