import Link from "next/link";
import Image from "next/image";
import styles from "./not-found.module.scss";

// 404 / страница не найдена (Figma 540-21098 / 540-21356 / 541-21952).
// Корневой not-found.tsx ловит и notFound(), и все несуществующие URL.
// Рендерится внутри RootLayout — хедер и футер приходят оттуда.
export default function NotFound() {
  return (
    <section className={styles.notFound}>
      <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
        <ol className={styles.crumbs}>
          <li className={styles.crumb}>
            <Link href="/" aria-label="Главная">
              …
            </Link>
          </li>
          <li className={styles.crumb}>
            <span className={styles.sep} aria-hidden="true">
              /
            </span>
            <span aria-current="page">404</span>
          </li>
        </ol>
      </nav>

      <div className={styles.body}>
        <div className={styles.media}>
          <Image
            src="/images/not-found-building.png"
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
              страница <br className={styles.subtitleBreak} />
              не найдена
            </h1>
          </div>

          <div className={styles.actions}>
            <p className={styles.lead}>
              Этой страницы нет на плане.
              <br className={styles.leadBreak} /> Возможно, она ещё в проекте, а
              возможно — адрес указан неточно. Вернитесь на главную или
              воспользуйтесь меню, чтобы найти нужный маршрут.
            </p>
            <Link href="/" className={styles.button}>
              <span className={styles.buttonReturn}>вернуться </span>на главную
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
