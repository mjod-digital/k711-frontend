"use client";

import Image from "next/image";
import { useState } from "react";
import { useBooking } from "@/store/booking";
import { sendLead } from "@/lib/comagic";
import { PhoneInput, isPhoneComplete } from "@/components/ui/PhoneInput";
import styles from "./Contact.module.scss";

const isNameOk = (v: string) => v.trim().length >= 2 && !/\d/.test(v);

export function Contact() {
  const openSuccess = useBooking((s) => s.openSuccess);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const [dirty, setDirty] = useState({ name: false, phone: false, consent: false });
  const touch = (f: keyof typeof dirty) => setDirty((d) => ({ ...d, [f]: true }));

  const nameErr = !isNameOk(name);
  const phoneErr = !isPhoneComplete(phone);
  const consentErr = !consent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDirty({ name: true, phone: true, consent: true });
    if (nameErr || phoneErr || consentErr) return;

    sendLead({ source: "contact", name, phone, consent, marketing });
    openSuccess();
  };

  return (
    <section className={styles.contact} id="contact">
      <div className={styles.inner}>
        <div className={styles.media}>
          <Image
            src="/images/contact.webp"
            alt="Клубный дом k711"
            fill
            sizes="(min-width: 768px) 57vw, 100vw"
            className={styles.image}
          />
        </div>

        <div className={styles.panel}>
          <h2 className={styles.title}>
            записаться
            <br />
            на встречу
          </h2>

          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <input
                className={styles.input}
                type="text"
                name="name"
                placeholder="Имя"
                aria-label="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch("name")}
                data-invalid={dirty.name && nameErr ? "true" : undefined}
                aria-invalid={(dirty.name && nameErr) || undefined}
              />
              <PhoneInput
                className={styles.input}
                name="phone"
                placeholder="Телефон"
                aria-label="Телефон"
                value={phone}
                onValueChange={setPhone}
                onBlur={() => touch("phone")}
                error={dirty.phone && phoneErr}
              />
            </div>

            <div className={styles.checks}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    touch("consent");
                  }}
                  data-invalid={dirty.consent && consentErr ? "true" : undefined}
                />
                <span>
                  Соглашаюсь с{" "}
                  <a href="#" className={styles.link}>
                    политикой конфиденциальности
                  </a>{" "}
                  и даю своё согласие на обработку персональных данных
                </span>
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="marketing"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
                <span>Подписаться на маркетинговые и рекламные рассылки</span>
              </label>
            </div>

            <button type="submit" className={styles.submit}>
              оставить заявку
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
