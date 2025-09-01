
'use client';

import React from 'react'
import { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Card, CardContent } from "@/components/ui/card"
import { cn } from '@/lib/utils';

type PropType<T> = {
  slides: T[]
  options?: EmblaOptionsType,
  CardComponent: React.ElementType<{ pack?: T, character?: T, article?: T }>
  carouselClass?: string;
}

export const EmblaCarousel = <T extends { id: string }>({ slides, options, CardComponent, carouselClass }: PropType<T>) => {
  const [emblaRef] = useEmblaCarousel(options, [Autoplay()])

  const getItemProps = (item: T) => {
    if ('author' in item && 'price' in item) return { pack: item };
    if ('content' in item && 'slug' in item) return { article: item };
    if ('core' in item && 'visuals' in item) return { character: item };
    return {};
  }

  return (
    <div className={cn("embla", carouselClass)} ref={emblaRef}>
      <div className="embla__container">
        {slides.map((item) => (
          <div className="embla__slide" key={item.id}>
            <CardComponent {...getItemProps(item)} />
          </div>
        ))}
      </div>
    </div>
  )
}
