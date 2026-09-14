import type { GenplanApartment } from "@/lib/apartments";
import { Breadcrumb, type TBreadcrumbItem } from "@/components/ui/Breadcrumb";
import { GenplanStage } from "../stage/genplan-stage";
import styles from "./genplan.module.scss";

type TGenplan = {
  apartments: GenplanApartment[];
  itemsBreadcrumb?: TBreadcrumbItem[];
};

export function Genplan({
  apartments,
  itemsBreadcrumb,
}: TGenplan) {
  return (
    <section className={styles.genplan}>
      {itemsBreadcrumb && itemsBreadcrumb.length > 0 && (
        <Breadcrumb items={itemsBreadcrumb} />
      )}

      <GenplanStage apartments={apartments} />
    </section>
  );
}
