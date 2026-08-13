import { GENPLAN_VIEWS } from "../../model/config";
import type { GenplanPlayerStatus } from "../../model/types";
import styles from "./genplan-navigation.module.scss";
import { FC } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type TGenplanNavigation = {
  currentViewIndex: number;
  status: GenplanPlayerStatus;
  onSelect: (viewIndex: number) => void;
  className?: string;
};

export const GenplanNavigation: FC<TGenplanNavigation> = ({
  currentViewIndex,
  status,
  onSelect,
  className,
}) => {
  const isBusy = status === "loading" || status === "playing";
  const previousViewIndex = (currentViewIndex - 1 + GENPLAN_VIEWS.length) % GENPLAN_VIEWS.length;
  const nextViewIndex = (currentViewIndex + 1) % GENPLAN_VIEWS.length;

  return (
    <nav className={cn(styles.genplanNavigation, className)} aria-label="Переключение ракурса здания">
      <button
        className={styles.genplanNavigation__control}
        type="button"
        disabled={isBusy}
        aria-label="Следующий ракурс"
        onClick={() => onSelect(nextViewIndex)}
      >
        <Image src="/arrowLeft.svg" alt="" width={40} height={40} />
      </button>
      <button
        className={cn(styles.genplanNavigation__control, styles.genplanNavigation__control_next)}
        type="button"
        disabled={isBusy}
        aria-label="Предыдущий ракурс"
        onClick={() => onSelect(previousViewIndex)}
      >
        <Image src="/arrowLeft.svg" alt="" width={40} height={40} />
      </button>
    </nav>
  );
}
