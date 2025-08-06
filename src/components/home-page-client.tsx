
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Expand, X, Star, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Character } from '@/types/character';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';


type HomePageClientProps = {
    featuredCreations: Character[];
}

const topCreators = [
    { name: 'CyberVance', characters: 128, followers: '12.5k', avatar: 'https://placehold.co/100x100.png', hint: 'cyberpunk creator' },
    { name: 'MysticScribe', characters: 92, followers: '10.2k', avatar: 'https://placehold.co/100x100.png', hint: 'fantasy creator' },
    { name: 'AnimeForge', characters: 256, followers: '25.1k', avatar: 'https://placehold.co/100x100.png', hint: 'anime creator' },
    { name: 'PixelPioneer', characters: 312, followers: '8.9k', avatar: 'https://placehold.co/100x100.png', hint: 'pixel art creator' },
];

const dataPacks = [
    { name: 'Cyberpunk Neon Styles', author: 'CyberVance', installs: '22.1k', image: 'https://placehold.co/600x400.png', hint: 'cyberpunk city' },
    { name: 'High-Fantasy Armors', author: 'MysticScribe', installs: '18.5k', image: 'https://placehold.co/600x400.png', hint: 'fantasy armor' },
    { name: 'Anime Eyes Pack Vol. 1', author: 'AnimeForge', installs: '45.2k', image: 'https://placehold.co/600x400.png', hint: 'anime eyes' },
    { name: '8-Bit Retro Effects', author: 'PixelPioneer', installs: '12.8k', image: 'https://placehold.co/600x400.png', hint: 'pixel art' },
];


export function HomePageClient({ featuredCreations }: HomePageClientProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  return (
    <div className="flex flex-col min-h-screen">
        <main className="flex-1">
             {/* Hero Section with Carousel */}
            <section className="w-full h-[60vh] md:h-[70vh] relative overflow-hidden">
                <div className="embla h-full" ref={emblaRef}>
                    <div className="embla__container h-full">
                        {featuredCreations.map((creation) => (
                            <div key={creation.id} className="embla__slide relative h-full">
                                <Image
                                    src={creation.imageUrl}
                                    alt={creation.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    >
                                        <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl leading-tight tracking-wider drop-shadow-2xl">
                                            {creation.name}
                                        </h1>
                                        <div className="flex items-center gap-4 mt-4">
                                            <Avatar>
                                                 <AvatarImage src="https://placehold.co/100x100.png" alt={`@${creation.userName}`} data-ai-hint="user avatar" />
                                                <AvatarFallback>{creation.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <p className="text-lg md:text-xl font-semibold drop-shadow-lg">@{creation.userName}</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            <section id="top-creators" className="container py-12 md:py-16">
                 <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
                    <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">Top Creators</h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                      Meet the master forgers shaping new worlds.
                    </p>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {topCreators.map((creator, index) => (
                         <motion.div
                            key={creator.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                         >
                            <Card className="text-center p-6 hover:bg-card/80 transition-colors duration-300 shadow-md hover:shadow-primary/20">
                                <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-primary/50">
                                    <AvatarImage src={creator.avatar} alt={creator.name} data-ai-hint={creator.hint} />
                                    <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold">{creator.name}</h3>
                                <p className="text-muted-foreground text-sm mb-4">{`@${creator.name.toLowerCase()}`}</p>
                                <div className="flex justify-around">
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{creator.characters}</p>
                                        <p className="text-xs text-muted-foreground">Creations</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{creator.followers}</p>
                                        <p className="text-xs text-muted-foreground">Followers</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>
            
            <section id="datapacks" className="container py-12 md:py-16">
                 <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
                    <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">New DataPacks</h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                      Expand your creative arsenal with community-made asset packs.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {dataPacks.map((pack, index) => (
                        <motion.div
                            key={pack.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="overflow-hidden group hover:shadow-primary/20 transition-all duration-300">
                                <div className="relative aspect-video">
                                    <Image src={pack.image} alt={pack.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={pack.hint} />
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="text-lg font-bold truncate">{pack.name}</h3>
                                    <p className="text-sm text-muted-foreground">by @{pack.author}</p>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Download className="w-4 h-4" />
                                            <span>{pack.installs}</span>
                                        </div>
                                        <Button variant="secondary" size="sm">
                                            <Download className="mr-2" />
                                            Install
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

        </main>
    </div>
  );
}
