'use client';

import React from 'react'
import { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Card, CardContent } from "@/components/ui/card"

type PropType<T> = {
  slides: T[]
  options?: EmblaOptionsType,
  CardComponent: React.ElementType<{ pack: T } | { character: T }>
}

export const EmblaCarousel = <T extends { id: string }>({ slides, options, CardComponent }: PropType<T>) => {
  const [emblaRef] = useEmblaCarousel(options, [Autoplay()])

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {slides.map((item) => {
          // CRITICAL FIX: Check the type of each item individually instead of assuming
          // all items are the same based on the first one.
          const isDataPack = 'author' in item; 
          return (
            <div className="embla__slide" key={item.id}>
              <CardComponent {...(isDataPack ? { pack: item } : { character: item })} />
            </div>
          );
        })}
      </div>
    </div>
  )
}
