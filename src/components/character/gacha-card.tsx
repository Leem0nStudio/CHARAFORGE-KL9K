
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { StarRating } from '../showcase/star-rating';

const rarityStyles = {
  1: { // Common
    card: 'border-slate-700/50 hover:border-slate-500/70',
    glow: 'shadow-none',
  },
  2: { // Uncommon
    card: 'border-green-700/60 hover:border-green-500/80',
    glow: 'group-hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]',
  },
  3: { // Rare
    card: 'border-blue-600/60 hover:border-blue-400/80',
    glow: 'group-hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]',
  },
  4: { // Epic
    card: 'border-purple-600/70 hover:border-purple-400/90',
    glow: 'group-hover:shadow-[0_0_25px_rgba(192,132,252,0.5)] animate-pulse-glow-subtle',
  },
  5: { // Legendary
    card: 'border-amber-500/70 hover:border-amber-400',
    glow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse-glow',
  },
};


export function GachaCard({ character, disableLink = false }: { character: Character, disableLink?: boolean }) {
    const rarity = character.core.rarity || 1;
    const styles = rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles[1];

    const cardContent = (
      <motion.div
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 bg-slate-900/50 text-white shadow-lg transition-all duration-300",
          styles.card,
          styles.glow,
        )}
        whileHover={{ y: -5 }}
      >
        <Image
          src={character.visuals.imageUrl}
          alt={character.core.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-headline text-lg font-semibold tracking-wide drop-shadow-md truncate">{character.core.name}</h3>
            <div className="mt-1">
                <StarRating rating={rarity} />
            </div>
        </div>
      </motion.div>
    );

    if (disableLink) {
        return cardContent;
    }

    return (
        <Link href={`/showcase/${character.id}`} className="block h-full">
            {cardContent}
        </Link>
    );
}

// Add keyframes for subtle glow animations if they don't exist
const customKeyframes = `
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
  50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.7); }
}
@keyframes pulse-glow-subtle {
  0%, 100% { box-shadow: 0 0 10px rgba(192, 132, 252, 0.3); }
  50% { box-shadow: 0 0 20px rgba(192, 132, 252, 0.5); }
}
`;

const styleSheet = typeof document !== 'undefined' ? document.styleSheets[0] : null;
if (styleSheet && !styleSheet.cssRules[0]?.cssText.includes('pulse-glow')) {
    try {
        styleSheet.insertRule(`@keyframes pulse-glow { ${rarityStyles[5].glow} }`, styleSheet.cssRules.length);
        styleSheet.insertRule(`@keyframes pulse-glow-subtle { ${rarityStyles[4].glow} }`, styleSheet.cssRules.length);
    } catch(e) {
        // In some environments, this might not be possible. It's a progressive enhancement.
    }
}
