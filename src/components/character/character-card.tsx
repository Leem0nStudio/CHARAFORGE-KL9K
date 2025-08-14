

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, GitBranch, Layers, Package, Tag, Pilcrow, Image as ImageIcon } from 'lucide-react';
import { Card, CardFooter, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Character } from '@/types/character';
import { getSlotCategory } from '@/lib/app-config';
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
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            className="h-full"
        >
            <Card className="overflow-hidden group relative h-full flex flex-col border-2 border-transparent hover:border-primary transition-colors duration-300">
                <Link href={`/characters/${character.id}`} className="relative aspect-[3/4] w-full bg-muted/20 block">
                        <Image
                            src={character.imageUrl}
                            alt={character.name}
                            fill
                            className="object-cover w-full transition-transform duration-300 group-hover:scale-105"
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
                                            <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/20 text-purple-300 border-purple-500/50">
                                                <GitBranch className="h-3 w-3" />
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Branched from another creation</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                             )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                             <h3 className="font-bold text-lg leading-tight drop-shadow-md truncate font-headline">{character.name}</h3>
                        </div>
                </Link>
                 <CardContent className="p-3 bg-card flex-col items-start flex-grow">
                     {character.tags && character.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                            {character.tags.slice(0, 3).map((tag) => (
                                <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                                    <Badge
                                        variant="outline"
                                        className="cursor-pointer hover:border-primary/50"
                                        data-category={getSlotCategory(tag)}
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
                     <div className="flex flex-wrap gap-1">
                        {character.textEngine && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="secondary" className="capitalize"><Pilcrow className="mr-1" /> {character.textEngine}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Text generated with {character.textEngine}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {character.imageEngine && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="secondary" className="capitalize"><ImageIcon className="mr-1" /> {character.imageEngine}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Image generated with {character.imageEngine}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                         {character.dataPackName && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Link href={`/datapacks/${character.dataPackId}`}>
                                            <Badge variant="secondary" className="cursor-pointer hover:border-primary/50">
                                                <Package className="mr-1.5" />
                                                {character.dataPackName}
                                            </Badge>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Created with DataPack: {character.dataPackName}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                       )}
                     </div>
                </CardContent>
                <CardFooter className="p-3 bg-card/50 mt-auto">
                    <div className="w-full">
                        <Link href={`/users/${character.userId}`} className="text-xs text-muted-foreground flex items-center gap-1.5 hover:text-primary">
                            <User className="h-3 w-3" />
                            <span>by {character.userName}</span>
                        </Link>
                        {isBranch && character.originalAuthorName && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <GitBranch className="h-3 w-3" />
                                <span>from {character.originalAuthorName}</span>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
