import Link from "next/link";
import { FC, useEffect, useId, useMemo, useRef, useState } from "react";
import type { GenplanApartment } from "@/lib/apartments";
import { GENPLAN_FRAME_HEIGHT, GENPLAN_FRAME_WIDTH } from "../../model/config";
import { GenplanCard } from "../card/genplan-card";
import styles from "./apartment-overlay.module.scss";
import { ROUTES_PATH } from '@/config/site';
import { GenplanFlat } from '@/components/sections/Genplan/ui/flat/genplan-flat';

type TApartmentOverlay = {
  apartments: GenplanApartment[];
  selectedBedrooms: number[];
  viewId: GenplanApartment["polygon"][number]["viewId"];
  isInteractive: boolean;
};

type TPresentedCard = {
  apartment: GenplanApartment;
  polygon: GenplanApartment["polygon"][number];
  isOpen: boolean;
};

const CARD_CLOSE_DELAY_MS = 250;

export const ApartmentOverlay:FC<TApartmentOverlay> =({
  apartments,
  selectedBedrooms,
  viewId,
  isInteractive,
}) => {
  const [activeApartmentId, setActiveApartmentId] = useState<string | null>(null);
  const [presentedCard, setPresentedCard] = useState<TPresentedCard | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current === null) return;
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  useEffect(
    () => () => {
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  const overlayMaskId = `apartment-overlay-mask-${useId().replace(/:/g, "")}`;
  const visibleApartments = useMemo(
    () =>
      apartments.flatMap((apartment) => {
        if (selectedBedrooms.length > 0 && !selectedBedrooms.includes(apartment.bedrooms)) {
          return [];
        }

        const polygon = apartment.polygon.find((item) => item.viewId === viewId);
        return polygon ? [{ apartment, polygon }] : [];
      }),
    [apartments, selectedBedrooms, viewId],
  );

  const isPresentedCardVisible = presentedCard
    ? visibleApartments.some(({ apartment }) => apartment.id === presentedCard.apartment.id)
    : false;

  const showCard = ({ apartment, polygon }: Omit<TPresentedCard, "isOpen">) => {
    cancelScheduledClose();
    setActiveApartmentId(apartment.id);
    setPresentedCard({ apartment, polygon, isOpen: true });
  };

  const hideCard = (apartmentId: string) => {
    setActiveApartmentId((currentId) => currentId === apartmentId ? null : currentId);
    setPresentedCard((currentCard) =>
      currentCard?.apartment.id === apartmentId
        ? { ...currentCard, isOpen: false }
        : currentCard,
    );
  };

  const scheduleCardClose = (apartmentId: string) => {
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => {
      hideCard(apartmentId);
      closeTimeoutRef.current = null;
    }, CARD_CLOSE_DELAY_MS);
  };

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
                fill="black"
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
          <polygon
            key={`${apartment.id}-${viewId}-shade`}
            className={styles.genplanApartmentOverlay__shadePolygon}
            data-muted={activeApartmentId !== null && activeApartmentId !== apartment.id}
            points={polygon.points}
          />
        ))}

        {visibleApartments.map(({ apartment, polygon }) => (
          <Link
            href={`${ROUTES_PATH.apartments}/${apartment.id}`}
            key={`${apartment.id}-${viewId}`}
            className={styles.genplanApartmentOverlay__link}
            aria-label={`Квартира ${apartment.id}, ${apartment.floor} этаж, ${apartment.area} м²`}
            onMouseEnter={() => showCard({ apartment, polygon })}
            onMouseLeave={() => scheduleCardClose(apartment.id)}
            onFocus={() => showCard({ apartment, polygon })}
            onBlur={() => scheduleCardClose(apartment.id)}
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

      {presentedCard && (
        <GenplanCard
          key={`${presentedCard.apartment.id}-${presentedCard.polygon.viewId}`}
          polygonPoints={presentedCard.polygon.points}
          frameWidth={GENPLAN_FRAME_WIDTH}
          frameHeight={GENPLAN_FRAME_HEIGHT}
          isOpen={presentedCard.isOpen && isPresentedCardVisible}
          onPointerEnter={() => showCard({
            apartment: presentedCard.apartment,
            polygon: presentedCard.polygon,
          })}
          onPointerLeave={() => scheduleCardClose(presentedCard.apartment.id)}
          onFocus={() => showCard({
            apartment: presentedCard.apartment,
            polygon: presentedCard.polygon,
          })}
          onBlur={() => scheduleCardClose(presentedCard.apartment.id)}
          onExitComplete={() => {
            setPresentedCard((currentCard) =>
              currentCard?.apartment.id === presentedCard.apartment.id &&
              (!currentCard.isOpen || !isPresentedCardVisible)
                ? null
                : currentCard,
            );
          }}
        >
          <GenplanFlat {...presentedCard.apartment} />
        </GenplanCard>
      )}
    </>
  );
}
