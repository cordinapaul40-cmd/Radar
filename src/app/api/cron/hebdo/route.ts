import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const maxDuration = 300;

// Appelé chaque lundi par le planificateur (voir vercel.json).
// Chaque veille est lancée dans sa propre exécution, en parallèle,
// pour rester sous la durée maximale d'une fonction.
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { data: veilles } = await supabaseAdmin()
    .from("veilles")
    .select("id")
    .eq("active", true)
    .eq("frequence", "hebdo");

  const resultats = await Promise.allSettled(
    (veilles ?? []).map(({ id }) =>
      fetch(new URL(`/api/cron/veille/${id}`, request.url), {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).then((r) => r.json()),
    ),
  );
  return NextResponse.json({
    nb: resultats.length,
    resultats: resultats.map((r) => (r.status === "fulfilled" ? r.value : { ok: false, erreur: String(r.reason) })),
  });
}
