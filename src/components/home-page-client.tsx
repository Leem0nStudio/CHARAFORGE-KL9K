
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import type { ArticleWithCover } from '@/components/article/article-card';
import { motion } from 'framer-motion';
import { ArrowRight, Package, Wand2, Trophy, Image as ImageIcon, Sparkles, Newspaper } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DataPackCard } from './datapack/datapack-card';
import { SectionTitle } from './section-title';
import { RankBadge } from './rank-badge';
import { GachaCard } from './character/gacha-card';
import { ArticleCard } from './article/article-card';


type HomePageClientProps = {
    featuredCreations: Character[];
    topCreators: UserProfile[];
    newDataPacks: DataPack[];
    latestArticles: ArticleWithCover[];
    heroCharacter: Character | null;
}

export function HomePageClient({ featuredCreations, topCreators, newDataPacks, latestArticles, heroCharacter }: HomePageClientProps) {

  return (
    <div className="flex flex-col min-h-screen">
        <div className="flex-1 space-y-20 md:space-y-28">
            
            {/* Hero Section */}
             <section className="w-full pt-12 md:pt-24 lg:pt-32 relative overflow-hidden bg-gradient-to-b from-background to-primary/5">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
                         <motion.div
                             key={heroCharacter?.id || 'hero'}
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ duration: 0.6, delay: 0.2 }}
                             className="relative lg:order-last" // Reorder for large screens
                        >
                            {heroCharacter ? (
                                <GachaCard character={heroCharacter} />
                            ) : (
                                <Image
                                    src="https://placehold.co/600x600.png"
                                    alt="Hero Character Placeholder"
                                    width={600}
                                    height={600}
                                    className="mx-auto aspect-square overflow-hidden rounded-xl object-contain sm:w-full"
                                    data-ai-hint="fantasy character portrait"
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            )}
                        </motion.div>
                        <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                    Forge Legendary Characters with AI
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0 mt-4">
                                    Bring your ideas to life. Describe your character, choose a style, and let our AI create unique portraits and biographies for your stories, games, or creative projects.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="w-full max-w-sm mx-auto lg:mx-0"
                            >
                               <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Button asChild size="lg" className="font-headline text-lg">
                                        <Link href="/character-generator">
                                        <Wand2 className="mr-2"/> Start Creating
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" variant="secondary" className="font-headline text-lg">
                                        <Link href="/datapacks">
                                        <Package className="mr-2"/> Explore DataPacks
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>


            {/* DataPacks Section */}
            <section id="datapacks" className="container">
                <SectionTitle title="Fuel Your Imagination" subtitle="Expand your creative arsenal with these brand-new DataPacks." />
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {newDataPacks.slice(0, 4).map((pack, index) => (
                         <motion.div
                            key={pack.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <DataPackCard pack={pack} />
                        </motion.div>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild size="lg" variant="outline">
                        <Link href="/datapacks">Browse Full Catalog <ArrowRight className="ml-2"/></Link>
                    </Button>
                </div>
            </section>

            {/* Featured Gallery Section */}
            <section id="gallery" className="container">
                <SectionTitle title="Community Gallery" subtitle="Discover legendary characters forged by our community." />
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {featuredCreations.slice(0, 8).map((creation) => (
                        <GachaCard key={creation.id} character={creation} />
                    ))}
                </div>
            </section>

            {/* Latest Articles Section */}
            {latestArticles.length > 0 && (
                 <section id="articles" className="container">
                    <SectionTitle title="Recent Articles" subtitle="Check out the latest guides, tips, and stories from the community." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {latestArticles.map((article, index) => (
                            <motion.div
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <ArticleCard article={article} />
                            </motion.div>
                        ))}
                    </div>
                     <div className="text-center mt-12">
                        <Button asChild size="lg" variant="outline">
                            <Link href="/articles">Read All Articles <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </div>
                </section>
            )}
            
            {/* Top Creators */}
            <section id="top-creators" className="container">
                 <div className="max-w-md mx-auto">
                     <Card>
                         <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Master Forgers</span>
                            </CardTitle>
                         </CardHeader>
                         <CardContent>
                             <ul className="space-y-4">
                                {topCreators.map((creator, index) => (
                                     <li key={creator.uid}>
                                         <Link href={`/users/${creator.uid}`} className="flex items-center gap-4 group">
                                            <Avatar className="h-12 w-12 group-hover:ring-2 ring-primary transition-all">
                                                <AvatarImage src={creator.photoURL || undefined} alt={creator.displayName || 'Creator'} data-ai-hint="creator avatar" />
                                                <AvatarFallback>{creator.displayName?.charAt(0) || 'C'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-lg group-hover:text-primary transition-colors">{creator.displayName}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-400" /> {creator.stats?.charactersCreated || 0} creations</p>
                                            </div>
                                             <RankBadge rank={index + 1} />
                                         </Link>
                                     </li>
                                ))}
                            </ul>
                            {topCreators.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">No public creators found yet.</p>
                            )}
                         </CardContent>
                     </Card>
                 </div>
            </section>
        </div>
    </div>
  );
}
