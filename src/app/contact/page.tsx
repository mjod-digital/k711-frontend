import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "./ContactForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
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
      <Breadcrumb
        variant="contact"
        items={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Офис продаж" },
        ]}
      />

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
