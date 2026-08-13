import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import type { CSSProperties, FC, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import styles from "./genplan-card.module.scss";

type TGenplanCard = {
  children: ReactNode;
  polygonPoints: string;
  frameWidth: number;
  frameHeight: number;
  isOpen: boolean;
  onExitComplete?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

type CardSide = "left" | "right";

const CARD_GAP = 27;

const getPolygonBounds = (points: string) => {
  const coordinates = points.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  const xCoordinates: number[] = [];
  const yCoordinates: number[] = [];

  for (let index = 0; index + 1 < coordinates.length; index += 2) {
    xCoordinates.push(coordinates[index]);
    yCoordinates.push(coordinates[index + 1]);
  }

  if (xCoordinates.length === 0) {
    return { left: 0, right: 0, centerY: 0 };
  }

  const top = Math.min(...yCoordinates);
  const bottom = Math.max(...yCoordinates);

  return {
    left: Math.min(...xCoordinates),
    right: Math.max(...xCoordinates),
    centerY: (top + bottom) / 2,
  };
};

export const GenplanCard: FC<TGenplanCard> = ({
  children,
  polygonPoints,
  frameWidth,
  frameHeight,
  isOpen,
  onExitComplete,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<CardSide>("right");
  const bounds = useMemo(() => getPolygonBounds(polygonPoints), [polygonPoints]);
  const style = {
    "--genplan-card-left": `${(bounds.left / frameWidth) * 100}%`,
    "--genplan-card-right": `${(bounds.right / frameWidth) * 100}%`,
    "--genplan-card-center-y": `${(bounds.centerY / frameHeight) * 100}%`,
    "--genplan-card-gap": `${CARD_GAP}px`,
  } as CSSProperties;

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    const container = card?.offsetParent;

    if (!(card && container instanceof HTMLElement)) return;

    const updateSide = () => {
      const polygonRight = (bounds.right / frameWidth) * container.clientWidth;
      const availableSpace = container.clientWidth - polygonRight - CARD_GAP;
      const nextSide: CardSide = availableSpace >= card.offsetWidth ? "right" : "left";

      setSide((currentSide) => currentSide === nextSide ? currentSide : nextSide);
    };

    updateSide();

    const resizeObserver = new ResizeObserver(updateSide);
    resizeObserver.observe(container);
    resizeObserver.observe(card);

    return () => resizeObserver.disconnect();
  }, [bounds.right, frameWidth]);

  return (
    <div
      ref={cardRef}
      className={styles.genplanCard}
      data-side={side}
      data-state={isOpen ? "open" : "closed"}
      style={style}
    >
      <div
        className={styles.genplanCard__content}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && !isOpen) {
            onExitComplete?.();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};
