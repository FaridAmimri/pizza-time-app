const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export const eur = (v: number): string => euros.format(v);

export function formatHeures(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export const dateFr = (iso: string): string => iso.split("-").reverse().join("/");

// ---------- Dates et durées pour l'affichage ----------

/** Les dates sont stockées "AAAA-MM-JJ" ; on les affiche à midi UTC pour éviter tout décalage de fuseau. */
const enLettres = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { ...options, timeZone: "UTC" });

/** "sam. 29" */
export const jourCourt = (iso: string): string => enLettres(iso, { weekday: "short", day: "numeric" });

/** "samedi 29 août 2026" */
export const dateLongue = (iso: string): string =>
  enLettres(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** "août 2026" */
export const moisLong = (mois: string): string => enLettres(`${mois}-01`, { month: "long", year: "numeric" });

/** "7h30" (version compacte pour les tableaux) */
export function formatHCourt(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Date du jour chez l'utilisateur, au format "AAAA-MM-JJ". */
export const aujourdhui = (): string => new Date().toLocaleDateString("sv-SE");
