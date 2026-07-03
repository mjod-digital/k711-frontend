"use client";

import Link from "next/link";
import { useBooking } from "@/store/booking";
import { sendLead, type LeadApartment } from "@/lib/comagic";
import { Modal } from "@/components/ui/Modal";
import { PhoneInput } from "@/components/ui/PhoneInput";
import styles from "./Popups.module.scss";

// Попап «Забронировать резиденцию №N» (Figma 547-24961). Квартира — из карточки.
function BookingForm({
  apartment,
  onDone,
}: {
  apartment: LeadApartment | null;
  onDone: () => void;
}) {
  return (
    <>
      <h2 id="booking-title" className={styles.title}>
        забронировать
        <br />
        резиденцию{apartment ? ` №${apartment.number}` : ""}
      </h2>

      <form
        className={styles.form}
        // Гасим нативную подсказку браузера — оставляем свою подсветку (:user-invalid).
        onInvalidCapture={(e) => e.preventDefault()}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          // Заявка с инфой о квартире → CoMagic (fire-and-forget — попап сразу).
          sendLead({
            source: "booking",
            apartment,
            name: fd.get("name") as string,
            phone: fd.get("phone") as string,
            comment: fd.get("comment") as string,
            consent: !!fd.get("consent"),
            marketing: !!fd.get("marketing"),
          });
          onDone();
        }}
      >
        <div className={styles.fieldset}>
          <div className={styles.fields}>
            <div className={styles.row}>
              <input
                className={styles.input}
                type="text"
                name="name"
                placeholder="Имя"
                aria-label="Имя"
                required
              />
              <PhoneInput
                className={styles.input}
                name="phone"
                placeholder="+7 (9__) ___-__-__"
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
          </div>

          <div className={styles.checks}>
            <label className={styles.check}>
              <input type="checkbox" name="consent" defaultChecked required />
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
