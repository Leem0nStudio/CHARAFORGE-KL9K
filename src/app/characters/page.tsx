

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getCharacters } from '../actions/character-read';
import { buttonVariants } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Loader2, User, Swords, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { GachaCard } from '@/components/character/gacha-card';


export default function CharactersPage() {
  const { authUser, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    async function fetchCharacters() {
        setLoading(true);
        try {
        const fetchedCharacters = await getCharacters();
        setCharacters(fetchedCharacters);
        } catch (error) {
        console.error("Failed to fetch characters:", error);
        } finally {
        setLoading(false);
        }
    }

    fetchCharacters();
  }, [authUser, authLoading, router]);
  
  
  if (authLoading || loading) {
     return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
        <BackButton 
            title="My Armory"
            description="Your personal collection of forged characters."
        />
      
      <div className="max-w-7xl mx-auto mt-8">
          {characters.length > 0 ? (
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
          ) : (
              <div className="col-span-full w-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                  <ImageIcon className="h-16 w-16 mb-4 text-primary/70" />
                  <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">Your Gallery is Empty</h2>
                  <p className="max-w-xs mx-auto mb-6">It looks like you haven't forged any characters yet. Let's bring your first legend to life!</p>
                  <Link href="/character-generator" className={cn(buttonVariants({ size: 'lg' }), "bg-accent text-accent-foreground hover:bg-accent/90")}>
                      <Swords className="mr-2 h-5 w-5" />
                      Forge a New Character
                  </Link>
              </div>
          )}
      </div>
    </div>
  );
}

    