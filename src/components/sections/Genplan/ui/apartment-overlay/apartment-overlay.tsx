import Link from "next/link";
import { FC, useId, useMemo, useState } from "react";
import type { GenplanApartment } from "@/lib/apartments";
import { GENPLAN_FRAME_HEIGHT, GENPLAN_FRAME_WIDTH } from "../../model/config";
import styles from "./apartment-overlay.module.scss";

type TApartmentOverlay = {
  apartments: GenplanApartment[];
  viewId: GenplanApartment["polygon"][number]["viewId"];
  isInteractive: boolean;
};

export const ApartmentOverlay:FC<TApartmentOverlay> =({
  apartments,
  viewId,
  isInteractive,
}) => {
  const [activeApartmentId, setActiveApartmentId] = useState<string | null>(null);

  const overlayMaskId = `apartment-overlay-mask-${useId().replace(/:/g, "")}`;
  const visibleApartments = useMemo(
    () =>
      apartments.flatMap((apartment) => {
        const polygon = apartment.polygon.find((item) => item.viewId === viewId);
        return polygon ? [{ apartment, polygon }] : [];
      }),
    [apartments, viewId],
  );

  const active = visibleApartments.find(
    ({ apartment }) => apartment.id === activeApartmentId,
  );

  return (
    <>
      <svg
        className={styles.genplanApartmentOverlay}
        data-visible={isInteractive}
        viewBox={`0 0 ${GENPLAN_FRAME_WIDTH} ${GENPLAN_FRAME_HEIGHT}`}
        preserveAspectRatio="none"
        aria-label="Квартиры на выбранной стороне дома"
      >
        <defs>
          <mask id={overlayMaskId}>
            <rect
              width={GENPLAN_FRAME_WIDTH}
              height={GENPLAN_FRAME_HEIGHT}
              fill="white"
            />
            {visibleApartments.map(({ apartment, polygon }) => (
              <polygon
                key={`${apartment.id}-${viewId}-mask`}
                points={polygon.points}
                fill={activeApartmentId === null || activeApartmentId === apartment.id ? "black" : "white"}
              />
            ))}
          </mask>
        </defs>

        <rect
          className={styles.genplanApartmentOverlay__shade}
          width={GENPLAN_FRAME_WIDTH}
          height={GENPLAN_FRAME_HEIGHT}
          mask={`url(#${overlayMaskId})`}
        />

        {visibleApartments.map(({ apartment, polygon }) => (
          <Link
            href={`/apartments/${apartment.id}`}
            key={`${apartment.id}-${viewId}`}
            className={styles.genplanApartmentOverlay__link}
            aria-label={`Квартира ${apartment.id}, ${apartment.floor} этаж, ${apartment.area} м²`}
            onMouseEnter={() => setActiveApartmentId(apartment.id)}
            onMouseLeave={() => setActiveApartmentId(null)}
            onFocus={() => setActiveApartmentId(apartment.id)}
            onBlur={() => setActiveApartmentId(null)}
          >
            <polygon
              className={styles.genplanApartmentOverlay__polygon}
              data-active={activeApartmentId === apartment.id}
              data-muted={activeApartmentId !== null && activeApartmentId !== apartment.id}
              points={polygon.points}
            />
          </Link>
        ))}
      </svg>

      {active && (
        <div
          className={styles.genplanApartmentOverlay__hint}
          style={{
            left: `${(active.polygon.label.x / GENPLAN_FRAME_WIDTH) * 100}%`,
            top: `${(active.polygon.label.y / GENPLAN_FRAME_HEIGHT) * 100}%`,
          }}
        >
          <strong>№ {active.apartment.id}</strong>
          <span>{active.apartment.floor} этаж</span>
          <span>{active.apartment.area} м²</span>
        </div>
      )}
    </>
  );
}
