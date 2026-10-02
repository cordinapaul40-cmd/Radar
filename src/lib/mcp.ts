import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CATEGORIES, STATUTS } from "@/lib/types";
import { SignalSchema } from "@/lib/veille";

// Serveur MCP de Radar pour un utilisateur donné : outils et prompt exposés à son Claude.

const texte = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const json = (v: unknown) => texte(JSON.stringify(v, null, 2));

export function serveurPour(userId: string) {
  const admin = supabaseAdmin();

  return createMcpHandler(
    (server) => {
      server.registerTool(
        "lister_veilles",
        {
          title: "Lister mes veilles",
          description: "Liste les veilles Radar de l'utilisateur (sujet, thèmes, sources préférées, dernier numéro).",
          inputSchema: z.object({}),
        },
        async () => {
          const { data } = await admin
            .from("veilles")
            .select("id, nom, description, themes, sources_preferees, langue, frequence, derniere_execution")
            .eq("user_id", userId)
            .order("created_at");
          return json(data ?? []);
        },
      );

      server.registerTool(
        "lire_profil",
        {
          title: "Lire mon profil",
          description: "Profil du lecteur : activité, secteurs, ce qu'il cherche. À utiliser pour choisir les signaux pertinents.",
          inputSchema: z.object({}),
        },
        async () => {
          const { data } = await admin
            .from("profils")
            .select("nom, activite, secteurs, ambitions")
            .eq("user_id", userId)
            .maybeSingle();
          return json(data ?? {});
        },
      );

      server.registerTool(
        "creer_veille",
        {
          title: "Créer une veille",
          description: "Crée une nouvelle veille Radar.",
          inputSchema: z.object({
            nom: z.string().describe("Nom court de la veille"),
            description: z.string().describe("Le sujet à surveiller, en langage libre"),
            themes: z.array(z.string()).optional(),
            sources_preferees: z.array(z.string()).optional(),
          }),
        },
        async (v) => {
          const { data, error } = await admin
            .from("veilles")
            .insert({ ...v, user_id: userId, frequence: "manuelle" })
            .select("id, nom")
            .single();
          return error ? texte(`Erreur : ${error.message}`) : json(data);
        },
      );

      server.registerTool(
        "lire_signaux",
        {
          title: "Lire les signaux",
          description:
            "Derniers signaux enregistrés (titre, date, catégorie, statut, synthèse). " +
            "À consulter avant une nouvelle veille pour ne pas répéter un signal déjà publié.",
          inputSchema: z.object({
            veille_id: z.string().optional().describe("Limiter à une veille"),
            limite: z.number().int().min(1).max(100).optional(),
          }),
        },
        async ({ veille_id, limite }) => {
          let q = admin
            .from("signaux")
            .select("id, veille_id, date, titre, categorie, statut, synthese")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(limite ?? 30);
          if (veille_id) q = q.eq("veille_id", veille_id);
          const { data } = await q;
          return json(data ?? []);
        },
      );

      server.registerTool(
        "enregistrer_signaux",
        {
          title: "Enregistrer des signaux",
          description:
            "Range dans Radar les signaux faibles trouvés pour une veille. Chaque signal : titre, catégorie " +
            `(${Object.keys(CATEGORIES).join(", ")}), synthèse, pourquoi c'est un signal, le fait sourcé, le signal, ` +
            "conséquences à 1, 3 et 5 ans, opportunités (titre, cible, modèle, premier pas), indicateurs, thèmes, " +
            "secteurs, sources (libellé + URL réellement consultée) et une note de 1 à 5 sur chaque axe du radar.",
          inputSchema: z.object({ veille_id: z.string(), signaux: z.array(SignalSchema).min(1) }),
        },
        async ({ veille_id, signaux }) => {
          const { data: veille } = await admin
            .from("veilles")
            .select("id")
            .eq("id", veille_id)
            .eq("user_id", userId)
            .maybeSingle();
          if (!veille) return texte("Veille introuvable.");
          const borne = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
          const { error } = await admin.from("signaux").insert(
            signaux.map((s) => ({
              ...s,
              radar: Object.fromEntries(Object.entries(s.radar).map(([k, n]) => [k, borne(n)])),
              veille_id,
              user_id: userId,
            })),
          );
          if (error) return texte(`Erreur : ${error.message}`);
          await admin.from("veilles").update({ derniere_execution: new Date().toISOString() }).eq("id", veille_id);
          return texte(`${signaux.length} signal(aux) enregistré(s) dans Radar.`);
        },
      );

      server.registerTool(
        "changer_statut",
        {
          title: "Changer le statut d'un signal",
          description: `Statuts possibles : ${Object.entries(STATUTS).map(([k, v]) => `${k} (${v})`).join(", ")}.`,
          inputSchema: z.object({
            signal_id: z.string(),
            statut: z.enum(Object.keys(STATUTS) as [keyof typeof STATUTS, ...(keyof typeof STATUTS)[]]),
          }),
        },
        async ({ signal_id, statut }) => {
          const { error } = await admin
            .from("signaux")
            .update({ statut })
            .eq("id", signal_id)
            .eq("user_id", userId);
          return texte(error ? `Erreur : ${error.message}` : "Statut mis à jour.");
        },
      );

      server.registerPrompt(
        "veille_hebdo",
        {
          title: "Faire ma veille de la semaine",
          description: "Cherche les signaux faibles de la semaine pour une veille et les range dans Radar.",
          argsSchema: z.object({ veille: z.string().describe("Nom ou identifiant de la veille") }),
        },
        ({ veille }) => ({
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text:
                  `Fais ma veille Radar « ${veille} » de la semaine. ` +
                  "1) Appelle lister_veilles, lire_profil et lire_signaux pour connaître le sujet, mon profil et ce qui est déjà publié. " +
                  "2) Cherche sur le web les faits des 7 derniers jours qui sont des signaux faibles pour ce sujet. " +
                  "3) Retiens les 5 plus utiles pour moi et enregistre-les avec enregistrer_signaux, " +
                  "en ne citant que des sources réellement consultées. 4) Résume-moi en quelques lignes ce que tu as trouvé.",
              },
            },
          ],
        }),
      );
    },
    { serverInfo: { name: "Radar", version: "0.2.0" } },
  );
}

