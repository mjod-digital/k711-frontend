import type { GenplanApartment } from "@/lib/apartments";
import { cn } from "@/lib/utils";
import type { FC } from "react";
import styles from "./genplan-filter.module.scss";

type TGenplanFilter = {
  apartments: GenplanApartment[];
  selectedBedrooms: number[];
  onChange: (bedrooms: number[]) => void;
  className?: string;
};

export const GenplanFilter: FC<TGenplanFilter> = ({
  apartments,
  selectedBedrooms,
  onChange,
  className,
}) => {
  const bedroomOptions = [...new Set(apartments.map(({ bedrooms }) => bedrooms))].sort(
    (first, second) => first - second,
  );
  const isAllSelected = selectedBedrooms.length === 0;

  const toggleBedroom = (bedrooms: number) => {
    const nextBedrooms = selectedBedrooms.includes(bedrooms)
      ? selectedBedrooms.filter((value) => value !== bedrooms)
      : [...selectedBedrooms, bedrooms].sort((first, second) => first - second);

    onChange(nextBedrooms);
  };

  return (
    <div className={cn(styles.genplanFilter, className)} aria-label="Фильтр квартир по количеству спален">
      <button
        className={styles.genplanFilter__button}
        data-active={isAllSelected}
        type="button"
        aria-pressed={isAllSelected}
        onClick={() => onChange([])}
      >
        Все
      </button>
      {bedroomOptions.map((bedrooms) => (
        <button
          className={styles.genplanFilter__button}
          data-active={selectedBedrooms.includes(bedrooms)}
          type="button"
          key={bedrooms}
          aria-pressed={selectedBedrooms.includes(bedrooms)}
          onClick={() => toggleBedroom(bedrooms)}
        >
          {bedrooms} сп.
        </button>
      ))}
    </div>
  );
};
