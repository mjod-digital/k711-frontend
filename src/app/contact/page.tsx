import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "./ContactForm";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Офис продаж клубного дома k 7/11: +7 (495) 123-45-67, ул. Климашкина, 7/11, private@mr-group.ru.",
};

export default function ContactPage() {
  return (
    <section className={styles.contact}>
      {/* Хлебные крошки — только мобайл (на десктопе фото занимает левую колонку). */}
      <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
        <Link href="/" aria-label="Главная">
          …
        </Link>
        <span className={styles.sep} aria-hidden="true">
          /
        </span>
        <span aria-current="page">Офис продаж</span>
      </nav>

      <div className={styles.media}>
        <Image
          src="/images/contact-office.jpg"
          alt="Офис продаж клубного дома k 7/11"
          fill
          sizes="(max-width: 767.98px) 100vw, 50vw"
          className={styles.image}
        />
      </div>

      <div className={styles.panel}>
        <h1 className={styles.title}>контакты</h1>

        <div className={styles.info}>
          <a href="tel:+74951234567">+7 (495) 123-45-67</a>
          <span>ул. Климашкина, 7/11</span>
          <a href="mailto:private@mr-group.ru">private@mr-group.ru</a>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
