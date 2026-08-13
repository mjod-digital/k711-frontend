'use client';

import Image from 'next/image';
import type { FC } from 'react';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './genplan-flat.module.scss';
import { cn } from '@/lib/utils';
import { type GenplanApartment, ru } from '@/lib/apartments';
import { safeUrl } from '@/lib/url';
import 'swiper/css';
import 'swiper/css/pagination';

const TAGS_LIMIT = 4 as const

type TGenplanFlat = {
  className?: string;
} & GenplanApartment;

export const GenplanFlat: FC<TGenplanFlat> = ({
  className,
  id,
  floor,
  amount,
  images,
  layoutUrl,
  amountDiscount,
  tags,
}) => {
  const slides = [
    { src: layoutUrl, alt: `Планировка квартиры №${id}` },
    ...(images ?? []),
  ].flatMap(({ src, alt }) => {
    const safeSrc = safeUrl(src);
    return safeSrc ? [{ src: safeSrc, alt }] : [];
  });

  const showPagination = slides.length > 1;

  return (
    <div className={cn(className, styles.genplanFlat)}>
      {slides.length > 0 && (
        <Swiper
          modules={[Pagination]}
          pagination={showPagination ? { clickable: true } : false}
          className={styles.genplanFlat__slider}
          aria-label={`Планировки квартиры №${id}`}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={`${slide.src}-${index}`} className={styles.genplanFlat__slide}>
              <Image
                src={slide.src}
                alt={slide.alt}
                width={310}
                height={240}
                sizes="334px"
                className={styles.genplanFlat__image}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <div className={styles.genplanFlat__heading}>
        <div>
          № {id}
        </div>
        <div>
          {ru(amountDiscount ?? amount)} ₽
        </div>
      </div>

      <div className={styles.genplanFlat__floorWrapper}>
        <div className={styles.genplanFlat__floor}>
          этаж {floor} из 16
        </div>

        {(amount && amountDiscount) && (
          <div className={styles.genplanFlat__priceOldWrapper}>
            <div className={styles.genplanFlat__priceOld}>{ru(amount)} ₽</div>

            <div
              className={styles.genplanFlat__alertWrapper}
              tabIndex={0}
              aria-label="Цена до скидки"
            >
              <Image
                className={styles.genplanFlat__alert}
                src="/images/alert.png"
                alt="alert"
                width={12}
                height={12}
              />

              <div className={styles.genplanFlat__alertTooltip} role="tooltip">
                Цена до скидки
              </div>
            </div>
          </div>
        )}
      </div>

      {tags && tags.length > 0 && (
        <div className={styles.genplanFlat__tags}>
          {tags.slice(0, TAGS_LIMIT).map((tag, index) => (
            <div
              className={styles.genplanFlat__tag}
              key={`${tag}-${index}`}
            >
              {tag}
            </div>
          ))}
          {tags.length > TAGS_LIMIT && (
            <div className={styles.genplanFlat__tag}>
              …
            </div>
          )}
        </div>
      )}
    </div>
  )
}
