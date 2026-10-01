import { redirect } from "next/navigation";

/** L'ancien « Bilan du mois » est devenu l'onglet « Vue d'ensemble » (recettes), « Heures de l'équipe » et « Journal des feuilles ». */
export default function PageMois() {
  redirect("/");
}
