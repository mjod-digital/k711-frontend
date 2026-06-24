import { MAP_INNER, MAP_VIEWBOX } from "./mapData";

type MapVectorProps = { className?: string };

// Векторная карта района — инлайн SVG, собранный из Figma 277-16701
// (база-улицы + парки/вода + кольцо + подписи). Заменяет растр map-empty.png:
// чёткая на любом зуме, темизируема, без сетевого запроса. Подписи берут
// шрифт сайта (--font-body). Контент статичный → dangerouslySetInnerHTML безопасен.
export function MapVector({ className }: MapVectorProps) {
  return (
    <svg
      className={className}
      viewBox={MAP_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Карта района: k711 в центре Пресни"
      dangerouslySetInnerHTML={{ __html: MAP_INNER }}
    />
  );
}
