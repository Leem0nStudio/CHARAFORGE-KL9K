
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { motion } from 'framer-motion';
import { Heart, Swords, ArrowRight, Package, Wand2, User, GitBranch } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type HomePageClientProps = {
    featuredCreations: Character[];
    topCreators: UserProfile[];
    newDataPacks: DataPack[];
}

const SectionTitle = ({ title, subtitle }: { title: string, subtitle: string }) => (
     <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 text-center mb-12">
        <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">{title}</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            {subtitle}
        </p>
    </div>
)

const CreationCard = ({ creation, index }: { creation: Character, index: number }) => {
    const isBranch = !!creation.branchedFromId;

    return (
        <motion.div
            key={creation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <Card className="overflow-hidden group relative h-full flex flex-col border-2 border-transparent hover:border-primary transition-colors duration-300">
                <div className="aspect-square relative w-full bg-muted/20">
                    <Link href={`/characters/${creation.id}`}>
                        <Image
                            src={creation.imageUrl}
                            alt={creation.name}
                            fill
                            className="object-contain w-full transition-transform duration-300 group-hover:scale-105"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-2 right-2">
                             {isBranch && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <GitBranch className="h-3 w-3" />
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Branched</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                             )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                             <h3 className="font-bold text-lg leading-tight drop-shadow-md truncate">{creation.name}</h3>
                        </div>
                    </Link>
                </div>
                <CardFooter className="p-3 bg-card flex-col items-start flex-grow">
                     <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-grow">{creation.description}</p>
                     {creation.dataPackName && (
                        <Badge variant="outline" className="mb-2">
                            <Package className="h-3 w-3 mr-1.5" />
                            {creation.dataPackName}
                        </Badge>
                       )}
                    <div className="w-full">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            <span>by {creation.userName}</span>
                        </div>
                        {isBranch && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <GitBranch className="h-3 w-3" />
                                <span>from {creation.originalAuthorName || 'Unknown'}</span>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}


export function HomePageClient({ featuredCreations, topCreators, newDataPacks }: HomePageClientProps) {

  return (
    <div className="flex flex-col min-h-screen">
        <div className="flex-1 space-y-20 md:space-y-28">
            
            {/* Hero Section */}
             <section className="w-full pt-12 md:pt-24 lg:pt-32 relative overflow-hidden bg-gradient-to-b from-background to-primary/5">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                        <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                    Forja Personajes Legendarios con IA
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0 mt-4">
                                    Da vida a tus ideas. Describe tu personaje, elige un estilo y deja que nuestra IA cree retratos y biografías únicas para tus historias, juegos o proyectos creativos.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="w-full max-w-sm mx-auto lg:mx-0 space-y-2"
                            >
                               <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Button asChild size="lg" className="font-headline text-lg">
                                        <Link href="/character-generator">
                                        <Wand2 className="mr-2"/> Empezar a Crear
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" variant="secondary" className="font-headline text-lg">
                                        <Link href="/datapacks">
                                        <Package className="mr-2"/> Explorar DataPacks
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Image
                                src="https://placehold.co/600x600.png"
                                alt="Hero Character"
                                width={600}
                                height={600}
                                className="mx-auto aspect-square overflow-hidden rounded-xl object-contain sm:w-full lg:order-last"
                                data-ai-hint="fantasy character portrait"
                            />
                        </motion.div>
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
                            <Card className="overflow-hidden group hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col">
                                <Link href={`/datapacks/${pack.id}`} className="flex flex-col h-full">
                                    <CardHeader className="p-0">
                                        <div className="relative aspect-square bg-muted/20">
                                            <Image src={pack.coverImageUrl || 'https://placehold.co/600x600.png'} alt={pack.name} fill className="object-contain transition-transform duration-300 group-hover:scale-105 p-2" data-ai-hint="datapack cover image" />
                                            <Badge className={cn("absolute top-2 right-2 font-bold", pack.type === 'premium' && "bg-yellow-500 text-black", pack.type === 'free' && "bg-green-500")}>{pack.type}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <CardTitle className="text-xl">{pack.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">by @{pack.author}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <p className="text-sm text-primary font-semibold group-hover:underline">View Details <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
                                    </CardFooter>
                                </Link>
                            </Card>
                        </motion.div>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild size="lg" variant="outline">
                        <Link href="/datapacks">Browse Full Catalog <ArrowRight className="ml-2"/></Link>
                    </Button>
                </div>
            </section>

            {/* Featured Creations */}
            <section id="creations" className="container">
                <SectionTitle title="Community Gallery" subtitle="Discover legendary characters forged by our community." />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {featuredCreations.slice(0, 8).map((creation, index) => (
                         <CreationCard key={creation.id} creation={creation} index={index} />
                     ))}
                </div>
            </section>
            
            {/* Top Creators */}
            <section id="top-creators" className="container">
                 <SectionTitle title="Master Forgers" subtitle="Meet the creators shaping new worlds and inspiring the community." />
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
        </div>
    </div>
  );
}

    