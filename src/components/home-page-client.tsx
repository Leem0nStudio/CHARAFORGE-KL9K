
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bot, Swords, Rocket, ScrollText, User, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from '@/components/login-button';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';


const topCreators = [
    { name: 'seraphina', avatar: 'https://placehold.co/100x100.png', creations: 87, hint: 'female portrait' },
    { name: 'cypher', avatar: 'https://placehold.co/100x100.png', creations: 72, hint: 'male portrait' },
    { name: 'mad_max', avatar: 'https://placehold.co/100x100.png', creations: 65, hint: 'male portrait' },
    { name: 'elara', avatar: 'https://placehold.co/100x100.png', creations: 58, hint: 'female portrait' },
    { name: 'nexus', avatar: 'https://placehold.co/100x100.png', creations: 49, hint: 'male portrait' },
];

const dataPacks = [
    { name: 'High Fantasy', description: 'Elves, dwarves, and dragons.', icon: <Swords className="w-6 h-6" /> },
    { name: 'Cyberpunk Dystopia', description: 'Neon-lit streets and mega-corps.', icon: <Rocket className="w-6 h-6" /> },
    { name: 'Cosmic Horror', description: 'Unspeakable horrors from beyond.', icon: <ScrollText className="w-6 h-6" /> },
];


type HomePageClientProps = {
    featuredCreations: Character[];
}

export function HomePageClient({ featuredCreations }: HomePageClientProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="mr-4 flex items-center">
            <Link href="/" className="flex items-center gap-2">
                <Bot className="h-7 w-7 text-primary" />
                <span className="font-bold font-headline text-2xl tracking-wider">CharaForge</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
              <Link
                href="/character-generator"
                className={buttonVariants({
                  variant: "ghost",
                })}
              >
                Create
              </Link>
              <LoginButton />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-primary/20 -z-10"></div>
             <motion.div 
                className="container text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent drop-shadow-md">
                Forge Your Legends
                </h1>
                <p className="max-w-[700px] mx-auto text-lg text-muted-foreground sm:text-xl mt-4">
                Bring your characters to life with AI-powered biographies and stunning visuals. Describe your hero, and let CharaForge do the rest.
                </p>
                <div className="flex w-full items-center justify-center space-x-4 py-8">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/character-generator" className={cn(buttonVariants({ size: 'lg' }), "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20")}>
                        Start Forging <Swords className="ml-2 h-5 w-5" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                        href="#featured-creations"
                        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), "shadow-md")}
                    >
                        Explore Creations
                    </Link>
                  </motion.div>
                </div>
            </motion.div>
        </section>

        <section id="featured-creations" className="container space-y-12 py-16">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">Featured Creations</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Explore characters crafted by the CharaForge community.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCreations.length > 0 ? (
              featuredCreations.map((creation) => (
              <Card key={creation.id} className="overflow-hidden group">
                <CardHeader className="p-0 relative">
                  <Image
                    src={creation.imageUrl}
                    alt={creation.name}
                    width={400}
                    height={400}
                    className="w-full h-auto aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/0"></div>
                   <CardTitle className="font-headline text-2xl absolute bottom-4 left-4 text-white drop-shadow-lg">{creation.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-secondary/10">
                  <CardDescription className='flex items-center gap-2'>by @{creation.userName}</CardDescription>
                </CardContent>
              </Card>
            ))
            ) : (
               <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[200px] border-2 border-dashed rounded-lg bg-card/50">
                  <User className="h-12 w-12" />
                  <p className="text-lg font-medium font-headline tracking-wider mt-4">No Featured Characters Yet</p>
                  <p className="text-sm">Be the first to post a public character!</p>
              </div>
            )}
          </div>
        </section>

        <section id="top-creators" className="w-full bg-card/50 dark:bg-card py-16 my-16 border-y">
            <div className="container">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
                    <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">Top Creators</h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Meet the masterminds behind the most epic characters.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4">
                    {topCreators.map((creator) => (
                    <motion.div 
                        key={creator.name} 
                        className="flex flex-col items-center text-center gap-3"
                        whileHover={{ y: -8, scale: 1.05}}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Avatar className="h-28 w-28 border-4 border-primary/50 shadow-lg">
                          <AvatarImage src={creator.avatar} alt={creator.name} data-ai-hint={creator.hint} />
                          <AvatarFallback>{creator.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-xl font-headline tracking-wider">@{creator.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400"/> {creator.creations} Creations</p>
                    </motion.div>
                    ))}
                </div>
            </div>
        </section>

        <section id="data-packs" className="container space-y-12 py-16">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">New DataPacks</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Expand your creative universe with new styles, genres, and attributes.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
             {dataPacks.map((pack) => (
                <Card key={pack.name} className="flex flex-col group hover:border-primary transition-all duration-300 hover:shadow-primary/30">
                  <CardHeader className="flex-grow">
                    <div className="flex items-start gap-4">
                       <div className="p-4 bg-primary/10 rounded-lg text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">{pack.icon}</div>
                       <div className="flex-1">
                         <CardTitle className="font-headline text-2xl mb-1">{pack.name}</CardTitle>
                         <CardDescription>{pack.description}</CardDescription>
                       </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-4 mt-auto">
                    <Button variant="outline" className="w-full transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                      Explore Pack
                    </Button>
                  </CardFooter>
                </Card>
            ))}
          </div>
        </section>

      </main>
      <footer className="py-6 md:px-8 md:py-0 mt-16 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
             <Bot className="h-5 w-5 text-muted-foreground" />
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              CharaForge &copy; {new Date().getFullYear()}. Forged with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
