import Image from "next/image";
import styles from "./Contact.module.scss";

export function Contact() {
  return (
    <section className={styles.contact} id="contact">
      <div className={styles.inner}>
        <div className={styles.media}>
          <Image
            src="/images/contact.png"
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

          <form className={styles.form}>
            <div className={styles.fields}>
              <input
                className={styles.input}
                type="text"
                name="name"
                placeholder="Имя"
                aria-label="Имя"
              />
              <input
                className={styles.input}
                type="tel"
                name="phone"
                placeholder="Телефон"
                aria-label="Телефон"
              />
            </div>

            <div className={styles.checks}>
              <label className={styles.check}>
                <input type="checkbox" />
                <span>
                  Соглашаюсь с{" "}
                  <a href="#" className={styles.link}>
                    политикой конфиденциальности
                  </a>{" "}
                  и даю своё согласие на обработку персональных данных
                </span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" />
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
