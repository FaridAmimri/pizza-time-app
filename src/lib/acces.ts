/** Code d'accès partagé : le cookie contient une empreinte du mot de passe, jamais le mot de passe. */
export const COOKIE_ACCES = "acces-fiches";

export async function jetonAcces(motDePasse: string): Promise<string> {
  const octets = new TextEncoder().encode(`fiches-pizza-time:${motDePasse}`);
  const empreinte = await crypto.subtle.digest("SHA-256", octets);
  return Array.from(new Uint8Array(empreinte), (o) => o.toString(16).padStart(2, "0")).join("");
}

/** Comparaison sans court-circuit, pour ne pas révéler le début du mot de passe par le temps de réponse. */
export function egaux(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
