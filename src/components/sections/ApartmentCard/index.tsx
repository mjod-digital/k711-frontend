import Image from "next/image";
import Link from "next/link";
import { ru, type ApartmentDetail } from "@/lib/apartments";
import styles from "./ApartmentCard.module.scss";

// Компас из макета (481-12214) — вектор, инлайним.
function Compass() {
  return (
    <svg className={styles.compass} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <circle cx="48" cy="48" r="30" fill="#d5d3cc" />
      <path
        d="M78 28.0932C81.7911 33.7951 84 40.6396 84 48C84 67.8823 67.8823 84 48 84C34.8824 84 23.4034 76.9841 17.1108 66.5"
        stroke="#753b29"
        strokeWidth="0.5"
      />
      <path d="M39.1903 11.9266L54.2477 43.2136L41.7937 46.5507L39.1903 11.9266Z" fill="#753b29" />
      <path d="M13.952 60.6789L20.215 65.7728L14.4735 68.735L13.952 60.6789Z" fill="#753b29" />
      <circle cx="79" cy="29" r="2" fill="#753b29" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 12a3 3 0 1 0 0 .01M18 6a3 3 0 1 0 0 .01M18 18a3 3 0 1 0 0 .01M11.6 10.5l4.8-3M11.6 13.5l4.8 3"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20.3l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.54L12 20.3z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

const SPEC = (label: string, value: string) => ({ label, value });

export function ApartmentCard({ apt }: { apt: ApartmentDetail }) {
  // Состав характеристик — как в макете 481-12150 (6 строк).
  const specs = [
    SPEC("Общая площадь:", `${ru(apt.area)} м²`),
    SPEC("Стоимость за м²:", `${ru(apt.pricePerM2 * 1000)} ₽`),
    SPEC("Ввод в эксплуатацию:", apt.completion),
    SPEC("Этаж:", `${apt.floor}`),
    SPEC("Высота потолков:", apt.ceiling),
    SPEC("Вид из окна:", apt.view),
  ];

  return (
    <section className={styles.wrap}>
      <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
        <Link href="/" aria-label="Главная">
          …
        </Link>
        <span className={styles.sep} aria-hidden="true">
          /
        </span>
        <Link href="/apartments">Квартиры</Link>
        <span className={styles.sep} aria-hidden="true">
          /
        </span>
        <span aria-current="page">Квартира №{apt.number}</span>
      </nav>

      <article className={styles.card}>
        <h1 className={styles.title}>Квартира №{apt.number}</h1>

        {/* Аside: мини-план этажа + компас. Десктоп — правый столбец, мобайл —
            оверлей в правом верхнем углу плана. */}
        <div className={styles.aside}>
          <Image
            className={styles.keyplan}
            src={apt.keyPlan}
            alt="Расположение квартиры на этаже"
            width={246}
            height={163}
          />
          <Compass />
        </div>

        {/* Планировка с подписями улиц/двора. */}
        <div className={styles.plan}>
          <span className={`${styles.street} ${styles.streetTop}`}>ул. Климашкина</span>
          <span className={`${styles.street} ${styles.streetLeft}`}>ул. Пресненский Вал</span>
          <Image
            className={styles.planImg}
            src={apt.plan}
            alt={`Планировка квартиры №${apt.number}`}
            width={299}
            height={528}
          />
          <span className={`${styles.street} ${styles.streetRight}`}>ул. Большая Грузинская</span>
          <span className={`${styles.street} ${styles.streetBottom}`}>Внутренний двор</span>
        </div>

        {/* Левый столбец: характеристики, цена, теги, действия. */}
        <div className={styles.info}>
          <dl className={styles.specs}>
            {specs.map((s) => (
              <div key={s.label} className={styles.specRow}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.price}>
            {ru(apt.totalPrice)} ₽
            <span className={styles.oldPrice}>{ru(apt.oldPrice)} ₽</span>
          </p>

          {apt.tags.length > 0 && (
            <ul className={styles.tags}>
              {apt.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}

          <div className={styles.cta}>
            <button type="button" className={styles.iconBtn} aria-label="Поделиться">
              <ShareIcon />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="В избранное">
              <HeartIcon />
            </button>
            <button type="button" className={styles.book}>
              Забронировать
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
