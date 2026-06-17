"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import styles from "./Header.module.scss";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link href="/" className={styles.logo} onClick={() => setOpen(false)}>
          {siteConfig.name}
        </Link>

        <button
          type="button"
          className={styles.burger}
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={cn(styles.nav, open && styles.navOpen)}>
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
