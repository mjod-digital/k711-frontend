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

type CardPosition = {
  side: CardSide;
  shiftX: number;
  shiftY: number;
};

const CARD_GAP = 27;
const CARD_EDGE_GAP = 16;

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

const clamp = (value: number, min: number, max: number) => {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
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
  const [position, setPosition] = useState<CardPosition>({
    side: "right",
    shiftX: 0,
    shiftY: 0,
  });
  const bounds = useMemo(() => getPolygonBounds(polygonPoints), [polygonPoints]);
  const style = {
    "--genplan-card-left": `${(bounds.left / frameWidth) * 100}%`,
    "--genplan-card-right": `${(bounds.right / frameWidth) * 100}%`,
    "--genplan-card-center-y": `${(bounds.centerY / frameHeight) * 100}%`,
    "--genplan-card-gap": `${CARD_GAP}px`,
    "--genplan-card-shift-x": `${position.shiftX}px`,
    "--genplan-card-shift-y": `${position.shiftY}px`,
  } as CSSProperties;

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    const container = card?.offsetParent;

    if (!(card && container instanceof HTMLElement)) return;

    const updatePosition = () => {
      const { clientWidth, clientHeight } = container;
      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;

      const polygonLeft = (bounds.left / frameWidth) * clientWidth;
      const polygonRight = (bounds.right / frameWidth) * clientWidth;
      const centerY = (bounds.centerY / frameHeight) * clientHeight;

      const spaceRight = clientWidth - polygonRight - CARD_GAP;
      const spaceLeft = polygonLeft - CARD_GAP;
      const nextSide: CardSide =
        spaceRight >= cardWidth || spaceRight >= spaceLeft ? "right" : "left";

      const cardLeft =
        nextSide === "right"
          ? polygonRight + CARD_GAP
          : polygonLeft - CARD_GAP - cardWidth;
      const cardRight = cardLeft + cardWidth;

      let shiftX = 0;
      if (cardRight > clientWidth) shiftX = clientWidth - cardRight;
      if (cardLeft + shiftX < 0) shiftX = -cardLeft;

      const shiftY =
        clamp(
          centerY,
          cardHeight / 2 + CARD_EDGE_GAP,
          clientHeight - cardHeight / 2 - CARD_EDGE_GAP,
        ) - centerY;

      setPosition((current) => {
        if (
          current.side === nextSide &&
          current.shiftX === shiftX &&
          current.shiftY === shiftY
        ) {
          return current;
        }

        return { side: nextSide, shiftX, shiftY };
      });
    };

    updatePosition();

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(container);
    resizeObserver.observe(card);

    return () => resizeObserver.disconnect();
  }, [bounds.centerY, bounds.left, bounds.right, frameHeight, frameWidth]);

  return (
    <div
      ref={cardRef}
      className={styles.genplanCard}
      data-side={position.side}
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
