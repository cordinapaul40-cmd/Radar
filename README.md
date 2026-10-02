# Radar

Ta veille de signaux faibles, chaque semaine, propulsée par Claude.

Chacun crée son compte, décrit sa veille (sujet, thèmes, sources) et son profil.
Chaque lundi, Claude parcourt le web, repère les signaux faibles de la semaine et
les range dans le radar de l'utilisateur : le fait sourcé, pourquoi c'est un signal,
ses conséquences à 1, 3 et 5 ans, les opportunités à saisir et une note sur cinq axes
(nouveauté, impact, vitesse, certitude, accessibilité).

L'interface et le format des signaux reprennent l'artéfact « Radar des signaux faibles ».

## Comment Claude est branché

Anthropic n'autorise pas les applications tierces à proposer la connexion avec un
compte claude.ai. Radar fonctionne donc en **clé API personnelle** : chaque utilisateur
colle sa clé Anthropic (console.anthropic.com) dans ses réglages et ses veilles sont
facturées sur son propre compte. La clé est vérifiée, chiffrée (AES-256-GCM) et stockée
dans une table que seul le serveur peut lire.

Radar propose aussi un **connecteur Claude** (serveur MCP) : chacun active le connecteur
dans ses réglages Radar, obtient une adresse personnelle, et l'ajoute dans claude.ai
(Réglages > Connecteurs > Ajouter un connecteur personnalisé). C'est alors son propre
Claude, sur son abonnement, qui fait la recherche web et range les signaux dans Radar
(« fais ma veille Radar de la semaine », ou le prompt `veille_hebdo`). Aucune clé API
n'est nécessaire dans ce mode.

Outils exposés : `lister_veilles`, `lire_profil`, `creer_veille`, `lire_signaux`,
`enregistrer_signaux`, `changer_statut`. L'adresse contient un jeton secret dont seule
l'empreinte SHA-256 est stockée.

## Architecture

- **Next.js** (App Router) : pages, actions serveur et routes API.
- **Supabase** : authentification par lien magique, base Postgres avec Row Level Security
  (chacun ne voit que ses veilles et ses signaux). Schéma : `supabase/migrations/0001_init.sql`.
- **Claude** (`src/lib/veille.ts`) : une recherche web (`web_search`) puis une mise en forme
  en signaux structurés validés par un schéma Zod. Modèle `claude-opus-5-5`, avec repli
  automatique côté serveur si un filtre de sécurité refuse une requête.
- **Connecteur Claude** (`src/lib/mcp.ts`, `/api/mcp/[jeton]`) : serveur MCP via `mcp-handler`.
- **Tâche hebdomadaire** : `vercel.json` appelle `/api/cron/hebdo` chaque lundi à 6 h (UTC),
  qui lance chaque veille dans sa propre exécution (`/api/cron/veille/[id]`).

## Installation

1. Crée un projet sur [supabase.com](https://supabase.com), puis exécute dans l'éditeur SQL
   les fichiers de `supabase/migrations/`, dans l'ordre (`0001_init.sql`, puis `0002_connecteur.sql`).
2. Dans Supabase > Authentication > URL Configuration, ajoute
   `https://ton-domaine/auth/callback` aux URL de redirection.
3. Copie `.env.example` en `.env.local` et remplis les valeurs.
4. `npm install` puis `npm run dev`.

Pour la mise en ligne, importe le dépôt sur [vercel.com](https://vercel.com) et
renseigne les mêmes variables d'environnement.

## Limites connues (v1)

- Chaque veille dispose de 5 minutes (limite du plan gratuit de Vercel) ; au-delà de
  quelques dizaines de veilles, il faudra une file d'attente.
- « Lancer maintenant » attend la fin de la recherche (quelques minutes).
