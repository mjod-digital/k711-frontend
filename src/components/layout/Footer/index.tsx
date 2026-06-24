import { siteConfig } from "@/config/site";
import styles from "./Footer.module.scss";

const navCol1 = ["О проекте", "Окружение", "Архитектура", "Резиденции", "Дизайн и искусство"];
const navCol2 = ["Благоустройство", "Аменитис", "Передовые технологии", "Выборщик квартир", "Контакты"];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.svg" alt={siteConfig.name} className={styles.logo} width={248} height={40} />

        <nav className={styles.nav} aria-label="Подвал">
          <ul className={styles.col}>
            {navCol1.map((label) => (
              <li key={label}>
                <a href="#" className={styles.link}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <ul className={styles.col}>
            {navCol2.map((label) => (
              <li key={label}>
                <a href="#" className={styles.link}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <address className={styles.contacts}>
          <a href={siteConfig.phone.href}>{siteConfig.phone.display}</a>
          <a href="mailto:private@mr-group.ru">private@mr-group.ru</a>
          <span>ул. Климашкина, 7/11</span>
        </address>
      </div>

      {/* Логотип MR Private под адресом (макет 373-10117 «logo second») */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mr-private.svg"
        alt="MR Private"
        className={styles.mrLogo}
        width={134}
        height={20}
      />

      <div className={styles.bottom}>
        <p className={styles.disclaimer}>
          Настоящий материал носит исключительно информационный и рекламный
          характер, не является публичной офертой и предназначен для
          предварительного ознакомления с объектом недвижимости. Готовый объект,
          его интерьеры и элементы отделки могут отличаться от представленных на
          3D-визуализациях. Застройщик оставляет за собой право вносить изменения
          в проект на своё усмотрение и производить замену на альтернативные
          аналоги.
          <br />
          <br />
          Проектная декларация на сайте{" "}
          <a className={styles.link} href="#">
            Наш.Дом.РФ
          </a>
          .{" "}
          <a className={styles.link} href="#">
            Политика обработки персональных данных
          </a>
          . 
          <a className={styles.link} href="#">
            Согласие на обработку персональных данных.
          </a>
        </p>

        
      </div>
    </footer>
  );
}
