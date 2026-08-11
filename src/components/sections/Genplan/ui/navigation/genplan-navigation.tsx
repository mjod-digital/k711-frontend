import { GENPLAN_VIEWS } from "../../model/config";
import type { GenplanPlayerStatus } from "../../model/types";
import styles from "./genplan-navigation.module.scss";
import { FC } from 'react';

type TGenplanNavigation = {
  currentViewIndex: number;
  status: GenplanPlayerStatus;
  onSelect: (viewIndex: number) => void;
};

export const GenplanNavigation: FC<TGenplanNavigation> = ({
  currentViewIndex,
  status,
  onSelect,
}) => {
  const isBusy = status === "loading" || status === "playing";

  return (
    <div className={styles.genplanNavigation} aria-label="Ракурс здания">
      {GENPLAN_VIEWS.map((view, index) => (
        <button
          className={styles.genplanNavigation__button}
          data-active={currentViewIndex === index}
          type="button"
          key={view.id}
          disabled={isBusy}
          aria-pressed={currentViewIndex === index}
          onClick={() => onSelect(index)}
        >
          <span className={styles.genplanNavigation__number}>
            {String(index + 1).padStart(2, "0")}
          </span>
          {view.label}
        </button>
      ))}
    </div>
  );
}
