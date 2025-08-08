
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Heart, Swords, ArrowRight } from 'lucide-react';


type HomePageClientProps = {
    featuredCreations: Character[];
    topCreators: UserProfile[];
    newDataPacks: DataPack[];
}


export function HomePageClient({ featuredCreations, topCreators, newDataPacks }: HomePageClientProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  return (
    <div className="flex flex-col min-h-screen">
        <main className="flex-1">
             {/* Hero Section with Carousel */}
            <section className="w-full relative overflow-hidden">
                <div className="container py-12 md:py-16">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
                        <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">Featured Creations</h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Discover the latest legendary characters forged by our community.
                        </p>
                    </div>
                </div>
                <div className="embla h-[60vh] md:h-[70vh]" ref={emblaRef}>
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
                            key={creator.uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                         >
                            <Card className="text-center p-6 hover:bg-card/80 transition-colors duration-300 shadow-md hover:shadow-primary/20">
                                <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-primary/50">
                                    <AvatarImage src={creator.photoURL || undefined} alt={creator.displayName || 'Creator'} data-ai-hint="creator avatar" />
                                    <AvatarFallback>{creator.displayName?.charAt(0) || 'C'}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold font-headline">{creator.displayName}</h3>
                                <p className="text-muted-foreground text-sm mb-4">{`@${creator.displayName?.toLowerCase().replace(/\s+/g, '')}`}</p>
                                <div className="flex justify-around">
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{creator.stats?.charactersCreated || 0}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Swords className="h-3 w-3" /> Creations</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{creator.stats?.totalLikes || 0}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" /> Likes</p>
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
                    {newDataPacks.slice(0, 4).map((pack, index) => (
                        <motion.div
                            key={pack.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="overflow-hidden group hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col">
                                <Link href={`/datapacks/${pack.id}`} className="flex flex-col h-full">
                                    <div className="relative aspect-square">
                                        <Image src={pack.coverImageUrl || 'https://placehold.co/600x600.png'} alt={pack.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint="datapack cover image" />
                                    </div>
                                    <CardContent className="p-4 flex-grow">
                                        <h3 className="text-lg font-bold truncate font-headline">{pack.name}</h3>
                                        <p className="text-sm text-muted-foreground">by @{pack.author}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="secondary" size="sm" className="w-full">
                                            View Details <ArrowRight className="ml-2" />
                                        </Button>
                                    </CardFooter>
                                </Link>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

        </main>
    </div>
  );
}
