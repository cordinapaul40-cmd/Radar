import { NextResponse, type NextRequest } from "next/server";
import { executerVeille } from "@/lib/executer";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Veille } from "@/lib/types";

export const maxDuration = 300;

// Exécute une seule veille pour la tâche hebdomadaire, avec la clé API de son propriétaire.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const { data: veille } = await supabaseAdmin().from("veilles").select("*").eq("id", id).maybeSingle();
  if (!veille) return NextResponse.json({ erreur: "Veille introuvable" }, { status: 404 });
  return NextResponse.json({ veille: id, ...(await executerVeille(veille as Veille)) });
}
