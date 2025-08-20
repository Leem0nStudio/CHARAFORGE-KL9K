
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';

interface GachaCardProps {
    character: Character;
}

const rarityStyles = {
    1: 'from-gray-500/10 to-gray-800/20',
    2: 'from-green-500/10 to-green-800/20',
    3: 'from-blue-500/10 to-blue-800/20',
    4: 'from-purple-500/10 to-purple-800/20',
    5: 'from-yellow-500/10 to-yellow-800/20',
};

const rarityGlow = {
    4: 'shadow-[0_0_15px_3px] shadow-purple-500/50',
    5: 'shadow-[0_0_20px_5px] shadow-yellow-500/50 animate-pulse-glow',
}

export function GachaCard({ character }: GachaCardProps) {
    const rarity = character.core.rarity || 3;
    
    return (
        <motion.div
            key={character.id}
            variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 },
            }}
            className="h-full"
        >
            <Link href={`/characters/${character.id}`} className="block h-full group">
                <div className={cn(
                    'relative h-full overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br p-2 transition-all duration-300',
                    rarityStyles[rarity],
                    rarity >= 4 ? 'border-transparent' : '',
                    rarityGlow[rarity as keyof typeof rarityGlow],
                )}>
                    <div className="relative aspect-[3/4] w-full bg-muted/20 rounded-md overflow-hidden">
                        <Image
                            src={character.visuals.imageUrl}
                            alt={character.core.name}
                            fill
                            className="object-cover w-full transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                         <h3 className="font-bold text-lg leading-tight drop-shadow-md truncate font-headline">{character.core.name}</h3>
                         <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn(
                                    "w-4 h-4",
                                    i < rarity ? 'text-yellow-400 fill-yellow-400' : 'text-black/30'
                                )}/>
                            ))}
                         </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

