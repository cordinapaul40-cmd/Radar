import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Profil, Veille } from "./types";

const MODELE = "claude-opus-5-5";
// En cas de refus par un filtre de sécurité, l'API relance automatiquement
// la requête sur un modèle de repli adapté (paramètre « fallbacks »).
const REPLI = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const SignalSchema = z.object({
  titre: z.string(),
  categorie: z.enum(["entreprise", "societal", "innovation", "legislation"]),
  synthese: z.string(),
  pourquoi: z.string(),
  fait: z.string(),
  signal: z.string(),
  consequences: z.object({ an1: z.string(), an3: z.string(), an5: z.string() }),
  opportunites: z.array(
    z.object({ titre: z.string(), cible: z.string(), modele: z.string(), premierPas: z.string() }),
  ),
  indicateurs: z.array(z.string()),
  themes: z.array(z.string()),
  secteurs: z.array(z.string()),
  sources: z.array(z.object({ label: z.string(), url: z.string() })),
  radar: z.object({
    nouveaute: z.number().int(),
    impact: z.number().int(),
    vitesse: z.number().int(),
    certitude: z.number().int(),
    accessibilite: z.number().int(),
  }),
});
const NumeroSchema = z.object({ signaux: z.array(SignalSchema) });
export type SignalGenere = z.infer<typeof SignalSchema>;

function contexte(veille: Veille, profil: Profil | null, dejaVus: string[]) {
  return [
    `Sujet de la veille « ${veille.nom} » : ${veille.description}`,
    veille.themes.length ? `Thèmes : ${veille.themes.join(", ")}` : "",
    veille.sources_preferees.length ? `Sources à privilégier : ${veille.sources_preferees.join(", ")}` : "",
    profil?.activite ? `Activité du lecteur : ${profil.activite}` : "",
    profil?.secteurs?.length ? `Secteurs du lecteur : ${profil.secteurs.join(", ")}` : "",
    profil?.ambitions ? `Ce que le lecteur cherche : ${profil.ambitions}` : "",
    dejaVus.length ? `Signaux déjà publiés (ne pas les répéter) :\n- ${dejaVus.join("\n- ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Lance une veille avec la clé API de l'utilisateur :
 * 1. recherche web des signaux faibles de la semaine ;
 * 2. mise en forme en signaux structurés (même format que l'artéfact Radar).
 */
export async function lancerVeille(opts: {
  cleApi: string;
  veille: Veille;
  profil: Profil | null;
  dejaVus: string[];
  nbSignaux?: number;
}): Promise<SignalGenere[]> {
  const client = new Anthropic({ apiKey: opts.cleApi });
  const nb = opts.nbSignaux ?? 5;
  const langue = opts.veille.langue === "en" ? "anglais" : "français";

  // Étape 1 : recherche. Les tours longs de recherche web peuvent s'arrêter en
  // « pause_turn » : on renvoie alors le tour de l'assistant pour qu'il continue.
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content:
        `${contexte(opts.veille, opts.profil, opts.dejaVus)}\n\n` +
        `Cherche sur le web les faits publiés ces 7 derniers jours qui constituent des signaux faibles ` +
        `pour ce sujet : des événements encore marginaux qui pourraient annoncer un changement important. ` +
        `Retiens les ${nb} plus intéressants pour ce lecteur. Pour chacun, rapporte le fait précis, ` +
        `sa date, ses sources (URL) et pourquoi c'est un signal faible. Réponds en ${langue}.`,
    },
  ];
  let recherche: Anthropic.Beta.BetaMessage | undefined;
  for (let tour = 0; tour < 5; tour++) {
    recherche = await client.beta.messages
      .stream({
        model: MODELE,
        max_tokens: 64000,
        output_config: { effort: "high" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 15 }],
        messages,
        ...REPLI,
      })
      .finalMessage();
    if (recherche.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: recherche.content });
  }
  if (!recherche || recherche.stop_reason === "refusal") {
    throw new Error("Claude n'a pas pu mener cette recherche.");
  }
  const notes = recherche.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n");

  // Étape 2 : structuration en signaux.
  const numero = await client.beta.messages.parse({
    model: MODELE,
    max_tokens: 32000,
    output_config: { effort: "medium", format: betaZodOutputFormat(NumeroSchema) },
    system:
      "Tu rédiges un numéro de veille sur les signaux faibles, en " +
      langue +
      ". Pour chaque signal : un titre accrocheur, la catégorie, une synthèse de 2 phrases, " +
      "pourquoi c'est un signal faible, le fait sourcé, le signal lui-même, ses conséquences possibles " +
      "à 1, 3 et 5 ans, 1 à 3 opportunités concrètes pour le lecteur (cible, modèle économique, premier pas), " +
      "des indicateurs à surveiller, et une note de 1 à 5 sur chaque axe du radar. " +
      "N'invente aucune source : n'utilise que les URL présentes dans les notes.",
    messages: [
      {
        role: "user",
        content: `${contexte(opts.veille, opts.profil, [])}\n\nNotes de recherche :\n${notes}`,
      },
    ],
    ...REPLI,
  });
  if (numero.stop_reason === "refusal" || !numero.parsed_output) {
    throw new Error("La mise en forme des signaux a échoué.");
  }
  return numero.parsed_output.signaux.map((s) => ({
    ...s,
    radar: Object.fromEntries(
      Object.entries(s.radar).map(([k, v]) => [k, Math.max(1, Math.min(5, v))]),
    ) as SignalGenere["radar"],
  }));
}

export async function verifierCle(cleApi: string) {
  const client = new Anthropic({ apiKey: cleApi });
  await client.models.retrieve(MODELE);
}
