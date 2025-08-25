
'use client';

import { cn } from '@/lib/utils';
import { Swords, Star } from 'lucide-react';
import React from 'react';

const PathIcon: React.FC<{ path: string }> = ({ path }) => {
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
    return (
      <div className="w-6 h-6 grid place-content-center" title={path} aria-label={path}>
        {iconMap[path] || <Star className="text-slate-400"/>}
      </div>
    );
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
    <aside className="w-56 shrink-0 px-4 py-6 text-slate-200/90 hidden md:block">
      <div className="text-sm uppercase tracking-wide text-slate-300/70 mb-3">
        Data Bank
      </div>
      <div className="text-2xl font-semibold mb-6">Characters</div>

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
              <PathIcon path={archetype} />
              <span className="text-sm tracking-wide">{archetype}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
