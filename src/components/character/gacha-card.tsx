
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
    1: 'from-gray-500/10 to-gray-800/20 border-gray-600/50',
    2: 'from-green-600/10 to-green-900/20 border-green-600/50',
    3: 'from-blue-500/10 to-blue-800/20 border-blue-600/50',
    4: 'from-purple-500/10 to-purple-800/20 border-purple-500/60',
    5: 'from-yellow-500/10 to-yellow-800/20 border-yellow-500/60',
};

const rarityGlow = {
    4: 'shadow-[0_0_15px_3px] shadow-purple-500/40',
    5: 'shadow-[0_0_20px_5px] shadow-yellow-500/40 animate-pulse-glow',
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
                    'relative h-full overflow-hidden rounded-lg border-2 bg-gradient-to-br p-1.5 transition-all duration-300',
                    rarityStyles[rarity],
                    rarityGlow[rarity as keyof typeof rarityGlow],
                )}>
                    <div className="relative aspect-[3/4] w-full bg-card-highlight rounded-md overflow-hidden">
                        <Image
                            src={character.visuals.imageUrl}
                            alt={character.core.name}
                            fill
                            className="object-cover w-full transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                         <h3 className="font-bold text-lg leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] truncate font-headline">{character.core.name}</h3>
                         <div className="flex items-center mt-1 drop-shadow-md">
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
