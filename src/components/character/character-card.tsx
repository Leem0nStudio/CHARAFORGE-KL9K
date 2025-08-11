'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, GitBranch, Layers, Package, Tag } from 'lucide-react';
import { Card, CardFooter, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Character } from '@/types/character';
import { getSlotColorClass, chartColors } from '@/lib/app-config';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
    character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
    const isBranch = !!character.branchedFromId;
    const hasVersions = character.versions && character.versions.length > 1;

    return (
        <motion.div
            key={character.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
        >
            <Card className="overflow-hidden group relative h-full flex flex-col border-2 border-transparent hover:border-primary transition-colors duration-300">
                <Link href={`/characters/${character.id}`} className="relative aspect-square w-full bg-muted/20">
                        <Image
                            src={character.imageUrl}
                            alt={character.name}
                            fill
                            className="object-contain w-full transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                             {hasVersions && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <Layers className="h-3 w-3" /> {character.versions.length}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{character.versions.length} versions</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                             )}
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
                             <h3 className="font-bold text-lg leading-tight drop-shadow-md truncate">{character.name}</h3>
                        </div>
                </Link>
                 <CardContent className="p-3 bg-card flex-col items-start flex-grow">
                     {character.tags && character.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                            {character.tags.slice(0, 3).map((tag, index) => (
                                <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                                    <Badge
                                        variant="outline"
                                        className={cn("cursor-pointer hover:border-primary/50", getSlotColorClass(tag))}
                                    >
                                      {tag.replace(/_/g, ' ')}
                                    </Badge>
                                </Link>
                            ))}
                            {character.tags.length > 3 && <Badge variant="outline" className="text-xs">...</Badge>}
                        </div>
                     ) : (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-grow">{character.description}</p>
                     )}
                     {character.dataPackName && (
                        <Link href={`/datapacks/${character.dataPackId}`}>
                            <Badge variant="outline" className="mb-2 text-xs cursor-pointer hover:border-primary/50">
                                <Package className="h-3 w-3 mr-1.5" />
                                {character.dataPackName}
                            </Badge>
                        </Link>
                       )}
                </CardContent>
                <CardFooter className="p-3 bg-card/50">
                    <div className="w-full">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            <span>by {character.userName}</span>
                        </div>
                        {isBranch && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <GitBranch className="h-3 w-3" />
                                <span>from {character.originalAuthorName || 'Unknown'}</span>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
