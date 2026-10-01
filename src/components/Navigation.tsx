"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pour ajouter un onglet : une ligne ici, puis la page dans src/app/<chemin>/page.tsx. */
const ONGLETS = [
  { href: "/", libelle: "Vue d'ensemble" },
  { href: "/scanner", libelle: "Scanner une fiche" },
  { href: "/journal", libelle: "Journal des feuilles" },
  { href: "/equipe", libelle: "Heures de l'équipe" },
  { href: "/photos", libelle: "Photos archivées" },
];

export function Navigation() {
  const chemin = usePathname() ?? "";
  const actif = (href: string) => (href === "/" ? chemin === "/" : chemin === href || chemin.startsWith(`${href}/`));

  return (
    <nav aria-label="Navigation principale">
      {ONGLETS.map((o) => (
        <Link key={o.href} href={o.href} aria-current={actif(o.href) ? "page" : undefined}>
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}
