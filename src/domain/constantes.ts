/** Constantes métier partagées (sans dépendance, pour rester testables partout). */
export const PLATEFORMES = ["Just Eat", "Deliveroo", "Uber Eats", "Dishop"] as const;
export type Plateforme = (typeof PLATEFORMES)[number];
