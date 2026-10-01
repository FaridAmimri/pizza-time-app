/** CSV lisible directement par Excel en français (séparateur ";", virgule décimale, accents). */
import type { RecapMois } from "@/domain/calculs";

type Cellule = string | number;

function cellule(v: Cellule): string {
  return typeof v === "number" ? String(v).replace(".", ",") : `"${v.replace(/"/g, '""')}"`;
}

const heuresDecimales = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

export function recapVersCsv(mois: string, r: RecapMois): string {
  const lignes: Cellule[][] = [
    ["Bilan du mois", mois],
    ["Fiches saisies", r.nbFiches],
    [],
    ["Employé", "Jours travaillés", "Heures matin", "Heures soir", "Total heures", "Acomptes / conso (€)"],
    ...r.employes.map((e) => [e.nom, e.jours, heuresDecimales(e.matin), heuresDecimales(e.soir), heuresDecimales(e.journee), e.acomptes]),
    [],
    ["Recettes", "Montant (€)"],
    ["Espèces", r.recettes.especes],
    ["Tickets restaurant", r.recettes.ticketRestaurant],
    ["Cartes bancaires", r.recettes.carteBancaire],
    ["Chèques vacances", r.recettes.chequeVacance],
    ["Dishop en ligne", r.recettes.dishopEnLigne],
    ["Achats", r.recettes.achats],
    ["Acomptes", r.recettes.acomptes],
    ["Total en caisse", r.recettes.totalEnCaisse],
    ["Total en bon", r.recettes.totalEnBon],
    [],
    ["Plateforme", "Commandes", "Total (€)"],
    ...Object.entries(r.plateformes).map(([nom, p]) => [nom, p.nbCommandes, p.total]),
    [],
    ["Commandes annulées", r.commandesAnnulees],
  ];
  return "\uFEFF" + lignes.map((l) => l.map(cellule).join(";")).join("\r\n");
}
