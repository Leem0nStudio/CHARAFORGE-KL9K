

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getCharacters } from '../actions/character-read';
import { buttonVariants } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Loader2, User, Swords, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { GachaCard } from '@/components/character/gacha-card';
import { Button } from '@/components/ui/button';


export default function CharactersPage() {
  const { authUser, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCharacters = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    fetchCharacters();
  }, [authUser, authLoading, router, fetchCharacters]);
  
  
  if (authLoading) {
     return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[400px] w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full w-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-destructive/10">
            <AlertCircle className="h-16 w-16 mb-4 text-destructive" />
            <h2 className="text-2xl font-medium font-headline tracking-wider mb-2 text-destructive">Could Not Load Gallery</h2>
            <p className="max-w-md mx-auto mb-6">
                There was a problem fetching your data. This can sometimes be due to a temporary session issue. 
                Please try again, or log out and log back in if the problem persists.
            </p>
            <Button onClick={fetchCharacters}>
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
            </Button>
        </div>
      );
    }

    if (characters.length > 0) {
      return (
        <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.05,
                    },
                },
            }}
        >
            {characters.map(character => (
                <GachaCard key={character.id} character={character} />
            ))}
        </motion.div>
      );
    }

    return (
      <div className="col-span-full w-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
          <ImageIcon className="h-16 w-16 mb-4 text-primary/70" />
          <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">Your Gallery is Empty</h2>
          <p className="max-w-xs mx-auto mb-6">It looks like you haven't forged any characters yet. Let's bring your first legend to life!</p>
          <Link href="/character-generator" className={cn(buttonVariants({ size: 'lg' }), "bg-accent text-accent-foreground hover:bg-accent/90")}>
              <Swords className="mr-2 h-5 w-5" />
              Forge a New Character
          </Link>
      </div>
    );
  };


  return (
    <div className="container py-8">
        <BackButton 
            title="My Armory"
            description="Your personal collection of forged characters."
        />
      
      <div className="max-w-7xl mx-auto mt-8">
        {renderContent()}
      </div>
    </div>
  );
}
