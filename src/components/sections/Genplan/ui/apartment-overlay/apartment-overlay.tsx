import Link from "next/link";
import { FC, useId, useMemo, useState } from "react";
import { ru, type GenplanApartment } from "@/lib/apartments";
import { GENPLAN_FRAME_HEIGHT, GENPLAN_FRAME_WIDTH } from "../../model/config";
import { GenplanCard } from "../card/genplan-card";
import styles from "./apartment-overlay.module.scss";
import { ROUTES_PATH } from '@/config/site';

type TApartmentOverlay = {
  apartments: GenplanApartment[];
  selectedBedrooms: number[];
  viewId: GenplanApartment["polygon"][number]["viewId"];
  isInteractive: boolean;
};

type PresentedCard = {
  apartment: GenplanApartment;
  polygon: GenplanApartment["polygon"][number];
  isOpen: boolean;
};

export const ApartmentOverlay:FC<TApartmentOverlay> =({
  apartments,
  selectedBedrooms,
  viewId,
  isInteractive,
}) => {
  const [activeApartmentId, setActiveApartmentId] = useState<string | null>(null);
  const [presentedCard, setPresentedCard] = useState<PresentedCard | null>(null);

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

  const showCard = ({ apartment, polygon }: Omit<PresentedCard, "isOpen">) => {
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
            onMouseLeave={() => hideCard(apartment.id)}
            onFocus={() => showCard({ apartment, polygon })}
            onBlur={() => hideCard(apartment.id)}
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
          onExitComplete={() => {
            setPresentedCard((currentCard) =>
              currentCard?.apartment.id === presentedCard.apartment.id &&
              (!currentCard.isOpen || !isPresentedCardVisible)
                ? null
                : currentCard,
            );
          }}
        >
          <div className={styles.genplanApartmentOverlay__card}>
            <div className={styles.genplanApartmentOverlay__cardHeading}>
              <div>
                № {presentedCard.apartment.id}
              </div>
              <div>
                {ru(presentedCard.apartment.cost * 1_000_000)} ₽
              </div>
            </div>

            <div className={styles.genplanApartmentOverlay__cardFloor}>
              {presentedCard.apartment.floor} этаж
            </div>
          </div>
        </GenplanCard>
      )}
    </>
  );
}
