
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import type { ArticleWithCover } from '@/components/article/article-card';
import { motion } from 'framer-motion';
import { SectionTitle } from './section-title';
import { GachaCard } from './character/gacha-card';
import { DataPackCard } from './datapack/datapack-card';
import { EmblaCarousel } from './ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Swords, ArrowRight } from 'lucide-react';
import { ArticleCard } from './article/article-card';


export function HomePageClient({ featuredCreations, topCreators, newDataPacks, latestArticles, heroCharacter }: {
    featuredCreations: Character[];
    topCreators: UserProfile[];
    newDataPacks: DataPack[];
    latestArticles: ArticleWithCover[];
    heroCharacter: Character | null;
}) {

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

  return (
    <motion.div 
      className="space-y-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
        {/* Hero Section */}
        {heroCharacter && (
            <section className="container pt-12">
                 <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div 
                        variants={{ hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent">
                            Forge Your Legends
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                           Bring your characters to life with AI-powered biographies and stunning portraits. Your next great story starts here.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button asChild size="lg">
                                <Link href="/character-generator"><Swords className="mr-2"/> Start Forging</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/datapacks">Explore DataPacks <ArrowRight className="ml-2"/></Link>
                            </Button>
                        </div>
                    </motion.div>
                    <motion.div
                         variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                         transition={{ duration: 0.5, delay: 0.2 }}
                         className="flex justify-center"
                    >
                        <GachaCard character={heroCharacter} />
                    </motion.div>
                 </div>
            </section>
        )}

        {/* Featured Creations Section */}
        {featuredCreations.length > 0 && (
            <motion.section variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <SectionTitle title="Community Gallery" subtitle="Explore the latest epic characters forged by our vibrant community." />
                <EmblaCarousel slides={featuredCreations} CardComponent={({ character }) => character ? <GachaCard character={character} /> : null} />
            </motion.section>
        )}
        
        {/* Top Creators */}
        {topCreators.length > 0 && (
             <motion.section className="container" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                 <SectionTitle title="Master Forgers" subtitle="Meet the top creators shaping the worlds of CharaForge." />
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {topCreators.map(creator => (
                        <Link href={`/users/${creator.uid}`} key={creator.uid}>
                             <div className="text-center group">
                                <Avatar className="h-24 w-24 mx-auto border-4 border-card group-hover:border-primary transition-colors">
                                    <AvatarImage src={creator.photoURL || undefined} alt={creator.displayName || 'Creator'} />
                                    <AvatarFallback>{creator.displayName?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <h3 className="mt-2 font-semibold text-lg">{creator.displayName}</h3>
                                <p className="text-sm text-muted-foreground">{creator.stats?.charactersCreated || 0} Creations</p>
                            </div>
                        </Link>
                     ))}
                 </div>
            </motion.section>
        )}

        {/* New DataPacks Section */}
        {newDataPacks.length > 0 && (
             <motion.section variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                 <SectionTitle title="Latest DataPacks" subtitle="Discover new creative toolkits to inspire your next character." />
                <EmblaCarousel slides={newDataPacks} CardComponent={({ pack }) => pack ? <DataPackCard pack={pack} /> : null} />
            </motion.section>
        )}
        
         {/* Latest Articles Section */}
        {latestArticles.length > 0 && (
             <motion.section className="container" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <SectionTitle title="From the Forge" subtitle="Tips, guides, and stories from the CharaForge team." />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latestArticles.map(article => (
                       <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            </motion.section>
        )}

    </motion.div>
  );
}
