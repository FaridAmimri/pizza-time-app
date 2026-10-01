import { ecartCaisse, ecartMatin, sousTotaux, totalAcomptes, totalEnCaisse } from "@/domain/calculs";
import type { Fiche } from "@/domain/types";
import { eur } from "@/lib/format";

function Ligne({ label, valeur, total }: { label: string; valeur: number; total?: boolean }) {
  return (
    <tr className={total ? "total" : undefined}>
      <td>{label}</td>
      <td className="nombre">{eur(valeur)}</td>
    </tr>
  );
}

function Verdict({ ecart, libelle }: { ecart: number | null; libelle: string }) {
  if (ecart === null) return null;
  if (Math.abs(ecart) < 0.01) return <p className="ok">{libelle} : correspond à la fiche.</p>;
  return <p className="ecart-ko">{libelle} : écart de {eur(ecart)} avec le total écrit sur la fiche. Vérifiez les montants.</p>;
}

/** Totaux recalculés en direct pendant la vérification. */
export function Controle({ fiche }: { fiche: Fiche }) {
  const s = sousTotaux(fiche);
  return (
    <section className="bloc">
      <h2>Totaux calculés</h2>
      <div className="bloc-corps">
        <table className="tableau">
          <tbody>
            <Ligne label="Espèces (matin + soir)" valeur={s.especes} />
            <Ligne label="Tickets restaurant" valeur={s.ticketRestaurant} />
            <Ligne label="Cartes bancaires" valeur={s.carteBancaire} />
            <Ligne label="Chèques vacances" valeur={s.chequeVacance} />
            <Ligne label="Dishop en ligne" valeur={s.dishopEnLigne} />
            <Ligne label="Acomptes" valeur={totalAcomptes(fiche)} />
            <Ligne label="Total en caisse" valeur={totalEnCaisse(fiche)} total />
          </tbody>
        </table>
        <Verdict ecart={ecartMatin(fiche)} libelle="Caisse du matin" />
        <Verdict ecart={ecartCaisse(fiche)} libelle="Caisse de la journée" />
      </div>
    </section>
  );
}
