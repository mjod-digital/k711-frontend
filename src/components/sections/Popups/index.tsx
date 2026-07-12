"use client";

import Link from "next/link";
import { useState } from "react";
import { useBooking } from "@/store/booking";
import { sendLead, type LeadApartment } from "@/lib/comagic";
import { Modal } from "@/components/ui/Modal";
import { PhoneInput, isPhoneComplete } from "@/components/ui/PhoneInput";
import styles from "./Popups.module.scss";

const isNameOk = (v: string) => v.trim().length >= 2 && !/\d/.test(v);

// Попап «Забронировать резиденцию №N» (Figma 547-24961). Квартира — из карточки.
function BookingForm({
  apartment,
  onDone,
}: {
  apartment: LeadApartment | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
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

    // Заявка с инфой о квартире → CoMagic (fire-and-forget — попап сразу).
    sendLead({
      source: "booking",
      apartment,
      name,
      phone,
      comment,
      consent,
      marketing,
    });
    onDone();
  };

  return (
    <>
      <h2 id="booking-title" className={styles.title}>
        забронировать
        <br />
        резиденцию{apartment ? ` №${apartment.number}` : ""}
      </h2>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.fieldset}>
          <div className={styles.fields}>
            <div className={styles.row}>
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
                placeholder="+7 (9__) ___-__-__"
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
        </div>

        <button type="submit" className={styles.submit}>
          оставить заявку
        </button>
      </form>
    </>
  );
}

// Попап успеха (Figma 546-22744). Показывается после отправки формы Contact и брони.
function SuccessContent({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.success}>
      <h2 id="success-title" className={styles.title}>
        вы записались
        <br />
        на встречу
      </h2>
      <div className={styles.successBody}>
        <p className={styles.successText}>
          Мы свяжемся с вами в ближайшее время. А пока вы можете насладиться
          выбором других резиденций жилого комплекса.
        </p>
        <Link href="/apartments" className={styles.successCta} onClick={onClose}>
          к выборщику
        </Link>
      </div>
    </div>
  );
}

// Глобальный рендер попапов (монтируется в layout). Управляется booking-стором.
export function Popups() {
  const mode = useBooking((s) => s.mode);
  const apartment = useBooking((s) => s.apartment);
  const openSuccess = useBooking((s) => s.openSuccess);
  const close = useBooking((s) => s.close);

  return (
    <>
      <Modal
        open={mode === "booking"}
        onClose={close}
        className={styles.bookingPanel}
        labelledBy="booking-title"
      >
        <BookingForm apartment={apartment} onDone={openSuccess} />
      </Modal>

      <Modal
        open={mode === "success"}
        onClose={close}
        className={styles.successPanel}
        labelledBy="success-title"
      >
        <SuccessContent onClose={close} />
      </Modal>
    </>
  );
}
