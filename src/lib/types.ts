export const CATEGORIES = {
  entreprise: "Entreprise",
  societal: "Société",
  innovation: "Innovation",
  legislation: "Législation",
} as const;
export type Categorie = keyof typeof CATEGORIES;

export const STATUTS = {
  nouvelle: "Nouvelle",
  a_creuser: "À creuser",
  en_cours: "En cours",
  ecartee: "Écartée",
} as const;
export type Statut = keyof typeof STATUTS;

export const AXES = [
  ["nouveaute", "Nouveauté"],
  ["impact", "Impact"],
  ["vitesse", "Vitesse"],
  ["certitude", "Certitude"],
  ["accessibilite", "Accessibilité"],
] as const;

export type Profil = {
  user_id: string;
  nom: string | null;
  activite: string | null;
  secteurs: string[];
  ambitions: string | null;
  cle_api_apercu: string | null;
};

export type Veille = {
  id: string;
  user_id: string;
  nom: string;
  description: string;
  themes: string[];
  sources_preferees: string[];
  langue: string;
  frequence: "hebdo" | "manuelle";
  active: boolean;
  derniere_execution: string | null;
};

export type Signal = {
  id: string;
  veille_id: string;
  date: string;
  titre: string;
  categorie: Categorie;
  synthese: string | null;
  pourquoi: string | null;
  fait: string | null;
  signal: string | null;
  consequences: { an1?: string; an3?: string; an5?: string };
  opportunites: { titre: string; cible?: string; modele?: string; premierPas?: string }[];
  indicateurs: string[];
  themes: string[];
  secteurs: string[];
  sources: { label: string; url: string }[];
  radar: Partial<Record<(typeof AXES)[number][0], number>>;
  statut: Statut;
  notes: string | null;
};
