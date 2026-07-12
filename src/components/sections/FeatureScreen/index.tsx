import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./FeatureScreen.module.scss";

type FeatureScreenProps = {
  image: string;
  imageAlt?: string;
  lines: CascadeLine[];
  description: ReactNode;
  ctaLabel: string;
  ctaHref: string;
};

export function FeatureScreen({
  image,
  imageAlt = "",
  lines,
  description,
  ctaLabel,
  ctaHref,
}: FeatureScreenProps) {
  return (
    <section className={styles.feature}>
      <div className={styles.media}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 49vw, 100vw"
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <Reveal className={styles.headingWrap} delay={0}>
          <CascadeHeading lines={lines} className={styles.heading} />
        </Reveal>
        <Reveal className={styles.info} delay={120}>
          <p className={styles.desc}>{description}</p>
          <Link href={ctaHref} className={styles.cta}>
            {ctaLabel}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
