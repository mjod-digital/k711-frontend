"use client";

import { useBooking } from "@/store/booking";
import { PhoneInput } from "@/components/ui/PhoneInput";
import styles from "./contact.module.scss";

// Форма «Заказать звонок» (Figma 373-10119). После отправки — общий попап успеха;
// заявка уходит в /api/lead (source: contact). Нативная подсказка браузера погашена
// (onInvalidCapture) — своя подсветка обязательных полей через :user-invalid.
export function ContactForm() {
  const openSuccess = useBooking((s) => s.openSuccess);

  return (
    <form
      className={styles.form}
      onInvalidCapture={(e) => e.preventDefault()}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "contact",
            name: fd.get("name"),
            email: fd.get("email"),
            phone: fd.get("phone"),
            comment: fd.get("comment"),
          }),
        }).catch(() => {});
        openSuccess();
      }}
    >
      <div className={styles.fields}>
        <input
          className={styles.input}
          type="text"
          name="name"
          placeholder="Имя"
          aria-label="Имя"
          required
        />

        <div className={styles.row}>
          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            aria-label="Email"
            required
          />
          <PhoneInput
            className={styles.input}
            name="phone"
            placeholder="Телефон"
            aria-label="Телефон"
            required
          />
        </div>

        <input
          className={styles.input}
          type="text"
          name="comment"
          placeholder="Комментарий"
          aria-label="Комментарий"
        />

        <label className={styles.check}>
          <input type="checkbox" defaultChecked required />
          <span>
            Соглашаюсь с{" "}
            <a href="#" className={styles.link}>
              политикой конфиденциальности
            </a>{" "}
            и даю своё согласие на обработку персональных данных
          </span>
        </label>
      </div>

      <button type="submit" className={styles.submit}>
        заказать звонок
      </button>
    </form>
  );
}
