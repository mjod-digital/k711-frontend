import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "./ContactForm";
import { fetchContact } from "@/lib/api";
import styles from "./contact.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchContact();
  return { title: c.meta.title, description: c.meta.description };
}

// tel: только цифры/плюс из отформатированного телефона.
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default async function ContactPage() {
  const c = await fetchContact();

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
        <Image loading="eager"
          src={c.office.image}
          alt={c.office.alt}
          fill
          sizes="(max-width: 767.98px) 100vw, 50vw"
          className={styles.image}
        />
      </div>

      <div className={styles.panel}>
        <h1 className={styles.title}>контакты</h1>

        <div className={styles.info}>
          <a href={telHref(c.phone)}>{c.phone}</a>
          <span>{c.address}</span>
          <a href={`mailto:${c.email}`}>{c.email}</a>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
