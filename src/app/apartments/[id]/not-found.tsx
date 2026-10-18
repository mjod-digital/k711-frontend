import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ROUTES_PATH } from "@/config/site";
import styles from "../../not-found.module.scss";

// Заголовок и описание вкладки. При notFound() Next берёт метаданные layout'ов
// и этого файла, generateMetadata из page.tsx не участвует — без экспорта здесь
// вкладка показывала бы голое «k711» и описание-заглушку из siteConfig.
export const metadata: Metadata = {
  title: "Квартира не найдена",
  description:
    "Такой квартиры нет в продаже. Вернитесь в каталог — там все резиденции, доступные сейчас.",
};

// «Квартира не найдена» — срабатывает на notFound() из page.tsx этой папки:
// номера нет, ответ CRM битый или квартира не в продаже (продана, в резерве).
// Отдаёт код 404, noindex Next ставит сам. Причину намеренно не называем —
// статус непубличных лотов не раскрываем, «не найдена» и для проданной, и для
// несуществующей. Вёрстка — общая 404 (те же стили и фото), меняются тексты и
// кнопка: ведём в каталог, а не на главную.
export default function ApartmentNotFound() {
  return (
    <section className={styles.notFound}>
      <Breadcrumb
        variant="notFound"
        items={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Каталог", href: ROUTES_PATH.apartments },
          { label: "Квартира не найдена" },
        ]}
      />

      <div className={styles.body}>
        <div className={styles.media}>
          <Image
            src="/images/not-found-building.webp"
            alt="Фасад клубного дома k 7/11"
            fill
            sizes="(max-width: 767.98px) 100vw, 48vw"
            className={styles.image}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.heading}>
            <p className={styles.code}>404</p>
            <h1 className={styles.subtitle}>
              квартира <br className={styles.subtitleBreak} />
              не найдена
            </h1>
          </div>

          <div className={styles.actions}>
            <p className={styles.lead}>
              Такой квартиры нет в продаже.
              <br className={styles.leadBreak} /> Вернитесь в каталог — там все
              резиденции, доступные сейчас.
            </p>
            <Link href={ROUTES_PATH.apartments} className={styles.button}>
              <span className={styles.buttonReturn}>вернуться </span>в каталог
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
