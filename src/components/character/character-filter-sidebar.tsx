'use client';

import { cn } from '@/lib/utils';
import { Swords, Star, BookOpen, User, Shield } from 'lucide-react';
import React from 'react';
import { rpgArchetypes } from '@/lib/app-config';

const archetypeIcons: Record<string, React.ReactNode> = {
  Artificer: <User />,
  Barbarian: <Swords />,
  Bard: <BookOpen />,
  Cleric: <User />,
  Druid: <User />,
  Fighter: <Swords />,
  Monk: <User />,
  Paladin: <Shield />,
  Ranger: <User />,
  Rogue: <User />,
  Sorcerer: <Star />,
  Warlock: <Star />,
  Wizard: <Star />,
  All: <User />,
};

export function CharacterFilterSidebar({ 
    activeFilter, 
    onSelectFilter,
    archetypes
}: { 
    activeFilter: string; 
    onSelectFilter: (filter: string) => void;
    archetypes: string[];
}) {
  return (
    <aside className="w-56 shrink-0 px-4 py-6 text-slate-200/90 hidden md:block border-r border-slate-700/50 bg-background/50">
      <div className="text-sm uppercase tracking-wide text-slate-300/70 mb-3">
        Data Bank
      </div>
      <div className="text-2xl font-semibold mb-6 font-headline">Characters</div>

      <nav className="space-y-1">
        {archetypes.map((archetype) => {
          const isActive = activeFilter === archetype;
          return (
            <button
              key={archetype}
              onClick={() => onSelectFilter(archetype)}
              className={cn(
                "group w-full flex items-center gap-3 rounded-xl px-3 py-2 transition",
                isActive
                  ? "bg-white/10 ring-1 ring-white/20 text-white"
                  : "hover:bg-white/5 text-slate-300 hover:text-white"
              )}
            >
              {archetypeIcons[archetype] || <User />}
              <span className="text-sm tracking-wide">{archetype}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}