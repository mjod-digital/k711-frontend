import Link from "next/link";
import { siteConfig } from "@/config/site";
import styles from "./CatalogUnavailable.module.scss";

type CatalogUnavailableProps = {
  /** Заголовок состояния — у каждой страницы свой («каталог», «избранное», «выбор резиденции»). */
  title: string;
  /**
   * Уровень заголовка. На /apartments и /favorites h1 уже отдаёт PageHero → h2;
   * на /genplan заголовков нет вовсе → h1, иначе страница остаётся без h1.
   */
  headingAs?: "h1" | "h2";
  /** Доп. действие под телефоном (генплан уводит в каталог — там данные те же). */
  action?: { label: string; href: string };
};

// Состояние «источник каталога недоступен» (DATA-005).
// Намеренно НЕ похоже на «ничего не найдено»: пустой список покупатель читает как
// «всё продано», поэтому при сбое CRM говорим прямо, что это сбой, и даём живой
// канал — телефон отдела продаж из siteConfig.
export function CatalogUnavailable({
  title,
  headingAs = "h2",
  action,
}: CatalogUnavailableProps) {
  const Heading = headingAs;

  return (
    <section className={styles.block}>
      <Heading className={styles.title}>{title}</Heading>

      <p className={styles.text}>
        Данные о резиденциях сейчас не загружаются — это сбой на нашей стороне, а не
        отсутствие предложений. Обновите страницу через минуту или позвоните в отдел
        продаж: расскажем о наличии, планировках и стоимости.
      </p>

      <a href={siteConfig.phone.href} className={styles.phone}>
        {siteConfig.phone.display}
      </a>

      {action && (
        <Link href={action.href} className={styles.action}>
          {action.label}
        </Link>
      )}
    </section>
  );
}
