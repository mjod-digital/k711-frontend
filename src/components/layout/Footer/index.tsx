import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import styles from "./Footer.module.scss";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <p className={styles.copy}>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <nav className={styles.nav}>
          {siteConfig.nav.map((item) => (
            <a key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
