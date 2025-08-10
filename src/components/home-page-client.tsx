
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { motion } from 'framer-motion';
import { Heart, Swords, ArrowRight, Package, Wand2, User, GitBranch, Trophy } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';

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
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                             {creation.versionName && <Badge variant="secondary" className="text-xs">{creation.versionName}</Badge>}
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

const RankBadge = ({ rank }: { rank: number }) => {
    const colors = {
        1: 'bg-blue-600/20 text-blue-400 border-blue-500',
        2: 'bg-amber-600/20 text-amber-400 border-amber-500',
        3: 'bg-orange-700/20 text-orange-400 border-orange-500',
        default: 'bg-slate-600/20 text-slate-400 border-slate-500',
    };
    const color = colors[rank as keyof typeof colors] || colors.default;

    return (
        <div className={cn("flex items-center justify-center h-10 w-10 shrink-0 border", color)} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="font-bold text-sm z-10">#{rank}</span>
        </div>
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
                 <div className="max-w-md mx-auto">
                     <Card>
                         <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Master Forgers</span>
                                <Button variant="link" asChild>
                                    <Link href="#">More <ArrowRight className="w-4 h-4 ml-1" /></Link>
                                </Button>
                            </CardTitle>
                         </CardHeader>
                         <CardContent>
                             <ul className="space-y-2">
                                {topCreators.map((creator, index) => (
                                     <li key={creator.uid}>
                                         <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={creator.photoURL || undefined} alt={creator.displayName || 'Creator'} data-ai-hint="creator avatar" />
                                                <AvatarFallback>{creator.displayName?.charAt(0) || 'C'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-lg">{creator.displayName}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-400" /> {creator.stats?.charactersCreated || 0} creations</p>
                                            </div>
                                             <RankBadge rank={index + 1} />
                                         </div>
                                        {index < topCreators.length - 1 && <Separator className="mt-2" />}
                                     </li>
                                ))}
                            </ul>
                         </CardContent>
                     </Card>
                 </div>
            </section>
        </div>
    </div>
  );
}

    