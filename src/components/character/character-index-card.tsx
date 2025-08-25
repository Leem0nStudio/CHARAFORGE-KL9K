'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Character } from '@/types/character';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Swords, Star } from 'lucide-react';
import { rpgArchetypes } from '@/lib/app-config';

const PathIcon: React.FC<{ path: string | null }> = ({ path }) => {
    const iconMap: Record<string, React.ReactNode> = {
      All: <Star className="text-yellow-400" />,
      Warrior: <Swords className="text-red-400" />,
      Fighter: <Swords className="text-red-400" />,
      Paladin: <Swords className="text-red-400" />,
      Barbarian: <Swords className="text-red-400" />,
      Mage: <span className="text-xl">🧙</span>,
      Sorcerer: <span className="text-xl">🔮</span>,
      Warlock: <span className="text-xl">👿</span>,
      Wizard: <span className="text-xl">📜</span>,
      Rogue: <span className="text-xl">🗡️</span>,
      Ranger: <span className="text-xl">🏹</span>,
      Bard: <span className="text-xl">🎼</span>,
      Cleric: <span className="text-xl">✝️</span>,
      Druid: <span className="text-xl">🌿</span>,
      Monk: <span className="text-xl">🧘</span>,
      Artificer: <span className="text-xl">🛠️</span>,
    };
    if (!path) return <Star className="text-slate-400"/>;
    return (
      <div className="w-6 h-6 grid place-content-center" title={path} aria-label={path}>
        {iconMap[path] || <Star className="text-slate-400"/>}
      </div>
    );
  };

const StarsDisplay: React.FC<{ count: number }> = ({ count }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="w-4 h-4 drop-shadow"
          aria-hidden
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
            className={i < count ? (count >= 5 ? "fill-yellow-300" : "fill-amber-300") : "fill-slate-600"}
          />
        </svg>
      ))}
    </div>
);

export const CharacterIndexCard: React.FC<{ character: Character }> = ({ character }) => {
  return (
    <Link href={`/showcase/${character.id}`}>
        <motion.div
            whileHover={{ y: -4 }}
            className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-b from-slate-700/20 to-slate-900/40 backdrop-blur-sm"
        >
            <div className="absolute left-2 top-2 z-10 w-7 h-7 grid place-content-center rounded-full bg-black/40 ring-1 ring-white/20">
                <PathIcon path={character.core.archetype} />
            </div>

            <div className="aspect-[4/5] w-full bg-slate-800">
                <Image
                    src={character.visuals.imageUrl}
                    alt={character.core.name}
                    width={400}
                    height={520}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="p-3">
                <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-wide text-slate-100 truncate">
                    {character.core.name}
                </div>
                <StarsDisplay count={character.core.rarity} />
                </div>
            </div>
        </motion.div>
    </Link>
  );
};
