import Image from "next/image";
import Link from "next/link";
import { ru, type ApartmentDetail } from "@/lib/apartments";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { BookButton } from "@/components/ui/BookButton";
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

// Иконка скачивания PDF (Figma 527-13810) — документ со стрелкой вниз.
// viewBox 13.8 растягивается до 20px (×1.45), у соседнего сердца 24 сжимается до
// 20px (×0.83) — при одинаковом stroke-width линии выглядели бы вдвое толще.
// 0.8 × 1.45 ≈ 1.4 × 0.83: обводки совпадают по итоговой толщине на экране.
const DL_STROKE = 0.8;

function DownloadIcon() {
  return (
    <svg viewBox="0 0 13.2 13.8" fill="none" aria-hidden="true">
      <path d="M3.6 13.2H0.6L0.6 0.6H9L12.6 4.2V13.2H9.6" stroke="currentColor" strokeWidth={DL_STROKE} />
      <path d="M6.6 6.6L6.6 12.6" stroke="currentColor" strokeWidth={DL_STROKE} />
      <path d="M9 10.2L6.6 12.6L4.2 10.2" stroke="currentColor" strokeWidth={DL_STROKE} />
      <path d="M9 0.6V4.2H12.6" stroke="currentColor" strokeWidth={DL_STROKE} />
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
          <Image loading="eager"
            className={styles.keyplan}
            src={apt.keyPlan}
            alt="Расположение квартиры на этаже"
            width={246}
            height={163}
          />
          <Compass />
        </div>

        {/* Планировка с подписями улиц/двора. Вертикальные подписи лежат внутри
            .planFrame (съёживается под картинку) → «обнимают» план на любой ширине. */}
        <div className={styles.plan}>
          <span className={`${styles.street} ${styles.streetTop}`}>ул. Климашкина</span>
          <div className={styles.planFrame}>
            <span className={`${styles.street} ${styles.streetLeft}`}>ул. Пресненский Вал</span>
            <Image loading="eager"
              className={styles.planImg}
              src={apt.plan}
              alt={`Планировка квартиры №${apt.number}`}
              width={299}
              height={528}
            />
            <span className={`${styles.street} ${styles.streetRight}`}>ул. Большая Грузинская</span>
          </div>
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
            {apt.oldPrice > 0 && (
              <span className={styles.oldPrice}>{ru(apt.oldPrice)} ₽</span>
            )}
          </p>

          {apt.tags.length > 0 && (
            <ul className={styles.tags}>
              {apt.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}

          <div className={styles.cta}>
            <a
              href={apt.pdf}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              aria-label="Скачать PDF квартиры"
            >
              <DownloadIcon />
            </a>
            <FavoriteButton id={apt.id} className={styles.iconBtn} />
            <BookButton
              apartment={{
                number: apt.number,
                area: apt.area,
                floor: apt.floor,
                bedrooms: apt.bedrooms,
                totalPrice: apt.totalPrice,
              }}
              className={styles.book}
            >
              Забронировать
            </BookButton>
          </div>
        </div>
      </article>
    </section>
  );
}
