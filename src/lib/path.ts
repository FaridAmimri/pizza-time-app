/** Lecture / écriture immuable par chemin ("employes.2.soir.fs"). Les "doutes" de l'IA utilisent les mêmes chemins. */
export function getAt(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc == null ? acc : (acc as Record<string, unknown>)[k]), obj);
}

export function setAt<T>(obj: T, path: string, value: unknown): T {
  const [tete, ...reste] = path.split(".");
  const copie = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string, unknown>;
  copie[tete] = reste.length ? setAt(copie[tete], reste.join("."), value) : value;
  return copie as T;
}
