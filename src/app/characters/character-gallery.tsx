
'use client';

import React, { useState, useMemo } from 'react';
import type { Character } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { StarfieldBackground } from '@/components/character/starfield-background';
import { CharacterFilterSidebar } from '@/components/character/character-filter-sidebar';
import { CharacterCard } from '@/components/character/character-card';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CharacterGalleryProps {
    initialCharacters: Character[];
}

export function CharacterGallery({ initialCharacters }: CharacterGalleryProps) {
  const [characters] = useState<Character[]>(initialCharacters);
  const [activeFilter, setActiveFilter] = useState('All');

  const archetypes = useMemo(() => {
    const allArchetypes = characters.map(c => c.core.archetype).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(allArchetypes))];
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    if (activeFilter === 'All') {
      return characters;
    }
    return characters.filter(c => c.core.archetype === activeFilter);
  }, [characters, activeFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  return (
    <div className="relative min-h-screen">
      <StarfieldBackground />
      <div className="relative z-10 flex">
        <CharacterFilterSidebar
          archetypes={archetypes}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
             <h1 className="text-3xl font-headline tracking-wider text-slate-100">Character Armory</h1>
             <Button asChild>
                <Link href="/character-generator"><Plus className="mr-2"/> New Character</Link>
             </Button>
          </div>
          
           {filteredCharacters.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {filteredCharacters.map(char => (
                       <CharacterCard key={char.id} character={char} />
                    ))}
                </motion.div>
           ) : (
                <div className="flex flex-col items-center justify-center text-center h-[60vh] text-slate-400">
                    <p className="text-lg">No characters found for the filter: "{activeFilter}"</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveFilter('All')}>
                        Show All Characters
                    </Button>
                </div>
           )}
        </main>
      </div>
    </div>
  );
}
