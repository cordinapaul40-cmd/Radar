import { NextResponse, type NextRequest } from "next/server";
import { executerVeille } from "@/lib/executer";
import { utilisateurCourant } from "@/lib/supabase/server";
import type { Veille } from "@/lib/types";

export const maxDuration = 300;

// « Lancer maintenant » : l'utilisateur déclenche sa propre veille.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await utilisateurCourant();
  if (!user) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });

  // La lecture passe par RLS : on ne peut lancer que ses propres veilles.
  const { data: veille } = await supabase.from("veilles").select("*").eq("id", id).maybeSingle();
  if (!veille) return NextResponse.json({ erreur: "Veille introuvable" }, { status: 404 });

  const resultat = await executerVeille(veille as Veille);
  return NextResponse.json(resultat, { status: resultat.ok ? 200 : 500 });
}
