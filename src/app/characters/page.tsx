
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getCharacters } from '../actions/character-read';
import { Button } from '@/components/ui/button';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Loader2, Swords, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarfieldBackground } from '@/components/character/starfield-background';
import { CharacterFilterSidebar } from '@/components/character/character-filter-sidebar';
import { CharacterIndexCard } from '@/components/character/character-index-card';

export default function CharactersPage() {
  const { authUser, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const router = useRouter();

  const fetchCharacters = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedCharacters = await getCharacters();
      setCharacters(fetchedCharacters);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("Failed to fetch characters:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    fetchCharacters();
  }, [authUser, authLoading, router, fetchCharacters]);
  
  const filteredCharacters = useMemo(() => {
    if (activeFilter === 'All') return characters;
    return characters.filter(c => c.core.archetype === activeFilter);
  }, [characters, activeFilter]);
  
  const availableArchetypes = useMemo(() => {
    const archetypes = new Set(characters.map(c => c.core.archetype).filter(Boolean) as string[]);
    return ['All', ...Array.from(archetypes)];
  }, [characters]);

  if (authLoading) {
     return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg bg-destructive/10">
            <AlertCircle className="h-16 w-16 mb-4 text-destructive" />
            <h2 className="text-2xl font-medium font-headline tracking-wider mb-2 text-destructive">Could Not Load Armory</h2>
            <p className="max-w-md mx-auto mb-6">
                There was a problem fetching your data. Please try again.
            </p>
            <Button onClick={fetchCharacters}>
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
            </Button>
        </div>
      );
    }

    if (characters.length === 0) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg bg-card/50">
                <Swords className="h-16 w-16 mb-4 text-primary/70" />
                <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">Your Armory is Empty</h2>
                <p className="max-w-xs mx-auto mb-6">It looks like you haven't forged any characters yet. Let's bring your first legend to life!</p>
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/character-generator">Forge a New Character</Link>
                </Button>
            </div>
        )
    }

    return (
        <AnimatePresence>
            <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {filteredCharacters.map(character => (
                    <CharacterIndexCard key={character.id} character={character} />
                ))}
            </motion.div>
        </AnimatePresence>
    );
  };


  return (
    <div className="min-h-screen text-white relative">
        <StarfieldBackground />
         <div className="mx-auto max-w-7xl px-4 md:px-8 py-6">
            <div className="flex gap-6">
                <CharacterFilterSidebar 
                    activeFilter={activeFilter} 
                    onSelectFilter={setActiveFilter} 
                    archetypes={availableArchetypes}
                />
                <main className="flex-1">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm uppercase tracking-wide text-slate-300/70">
                                My Armory
                            </div>
                            <h1 className="text-3xl font-semibold">Characters</h1>
                        </div>
                        <div className="text-sm text-slate-200/80">
                            Total: {characters.length}
                        </div>
                    </div>
                    {renderContent()}
                </main>
            </div>
         </div>
    </div>
  );
}
