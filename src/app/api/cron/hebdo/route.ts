import { NextResponse, type NextRequest } from "next/server";
import { executerVeille } from "@/lib/executer";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Veille } from "@/lib/types";

export const maxDuration = 800;

// Appelé chaque lundi par le planificateur (voir vercel.json).
// Chaque veille tourne avec la clé API de son propriétaire.
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { data: veilles } = await supabaseAdmin()
    .from("veilles")
    .select("*")
    .eq("active", true)
    .eq("frequence", "hebdo");

  const resultats = [];
  for (const veille of (veilles ?? []) as Veille[]) {
    resultats.push({ veille: veille.id, ...(await executerVeille(veille)) });
  }
  return NextResponse.json({ nb: resultats.length, resultats });
}
