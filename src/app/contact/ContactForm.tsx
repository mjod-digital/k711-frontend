"use client";

import { useState } from "react";
import { useBooking } from "@/store/booking";
import { sendLead } from "@/lib/comagic";
import { PhoneInput, isPhoneComplete } from "@/components/ui/PhoneInput";
import styles from "./contact.module.scss";

// Валидация полей формы (как в проверенной прошлой форме): имя ≥ 2 символов и без
// цифр, телефон — 10 национальных цифр, согласие обязательно.
const isNameOk = (v: string) => v.trim().length >= 2 && !/\d/.test(v);
const isEmailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Форма «Заказать звонок» (Figma 373-10119). После отправки — общий попап успеха;
// заявка уходит в CoMagic (source: contact). Валидация своя (noValidate) с
// подсветкой полей: нативная погашена, ошибки появляются на blur и на submit.
export function ContactForm() {
  const openSuccess = useBooking((s) => s.openSuccess);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const [dirty, setDirty] = useState({
    name: false,
    email: false,
    phone: false,
    consent: false,
  });
  const touch = (f: keyof typeof dirty) => setDirty((d) => ({ ...d, [f]: true }));

  const nameErr = !isNameOk(name);
  const emailErr = !isEmailOk(email);
  const phoneErr = !isPhoneComplete(phone);
  const consentErr = !consent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDirty({ name: true, email: true, phone: true, consent: true });
    if (nameErr || emailErr || phoneErr || consentErr) return;

    sendLead({
      source: "contact",
      name,
      email,
      phone,
      comment,
      consent,
      marketing,
    });
    openSuccess();
  };

  return (
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

        <div className={styles.row}>
          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            data-invalid={dirty.email && emailErr ? "true" : undefined}
            aria-invalid={(dirty.email && emailErr) || undefined}
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

        <input
          className={styles.input}
          type="text"
          name="comment"
          placeholder="Комментарий"
          aria-label="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

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
      </div>

      <button type="submit" className={styles.submit}>
        заказать звонок
      </button>
    </form>
  );
}
