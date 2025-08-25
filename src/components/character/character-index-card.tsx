
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Character } from '@/types/character';
import Image from 'next/image';
import Link from 'next/link';

const ElementIcon: React.FC<{ archetype: string | null }> = ({ archetype }) => {
    const symbolMap: Record<string, string> = {
        Warrior: "⚔️",
        Fighter: "⚔️",
        Barbarian: "⚔️",
        Paladin: "⚔️",
        Mage: "🔮",
        Sorcerer: "🔮",
        Warlock: "🔮",
        Wizard: "🔮",
        Rogue: "🗡️",
        Ranger: "🏹",
        Bard: "🎼",
        Cleric: "✝️",
        Druid: "🌿",
        Monk: "🧘",
        Artificer: "🛠️",
    };
    return (
      <span className="text-xl" title={archetype || 'N/A'} aria-label={archetype || 'N/A'}>
        {symbolMap[archetype || ''] || '⭐'}
      </span>
    );
};

const Stars: React.FC<{ count: 4 | 5 | number }> = ({ count }) => (
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
            {/* Top bar with element icon */}
            <div className="absolute left-2 top-2 z-10 w-7 h-7 grid place-content-center rounded-full bg-black/40 ring-1 ring-white/20">
                <ElementIcon archetype={character.core.archetype} />
            </div>

            {/* Portrait */}
            <div className="aspect-[4/5] w-full bg-slate-800">
                <Image
                    src={character.visuals.imageUrl}
                    alt={character.core.name}
                    width={400}
                    height={520}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-wide text-slate-100 truncate">
                    {character.core.name}
                </div>
                <Stars count={character.core.rarity} />
                </div>
            </div>
        </motion.div>
    </Link>
  );
};
