import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Breadcrumb.module.scss";

export type TBreadcrumbItem = {
  label: ReactNode;
  href?: string;
  ariaLabel?: string;
};

export type BreadcrumbVariant = "hero" | "apartment" | "contact" | "notFound";

type TBreadcrumb = {
  items: TBreadcrumbItem[];
  variant?: BreadcrumbVariant;
  className?: string;
  ariaLabel?: string;
  separator?: ReactNode;
};

export function Breadcrumb({
  items,
  variant = "hero",
  className,
  ariaLabel = "Хлебные крошки",
  separator = "/",
}: TBreadcrumb) {
  return (
    <nav
      className={cn(styles.breadcrumb, styles[`breadcrumb--${variant}`], className)}
      aria-label={ariaLabel}
    >
      <ol className={styles.breadcrumb__list}>
        {items.map((item, index) => (
          <li key={`${item.href ?? "current"}-${index}`} className={styles.breadcrumb__item}>
            {index > 0 && (
              <span className={styles.breadcrumb__separator} aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href ? (
              <Link href={item.href} aria-label={item.ariaLabel}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
