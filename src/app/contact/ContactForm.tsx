"use client";

import { useBooking } from "@/store/booking";
import { sendLead } from "@/lib/comagic";
import { PhoneInput } from "@/components/ui/PhoneInput";
import styles from "./contact.module.scss";

// Форма «Заказать звонок» (Figma 373-10119). После отправки — общий попап успеха;
// заявка уходит в CoMagic (source: contact). Нативная подсказка браузера погашена
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
        sendLead({
          source: "contact",
          name: fd.get("name") as string,
          email: fd.get("email") as string,
          phone: fd.get("phone") as string,
          comment: fd.get("comment") as string,
          consent: !!fd.get("consent"),
          marketing: !!fd.get("marketing"),
        });
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

        <div className={styles.checks}>
          <label className={styles.check}>
            <input type="checkbox" name="consent" required />
            <span>
              Соглашаюсь с{" "}
              <a href="#" className={styles.link}>
                политикой конфиденциальности
              </a>{" "}
              и даю своё согласие на обработку персональных данных
            </span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" name="marketing" />
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
