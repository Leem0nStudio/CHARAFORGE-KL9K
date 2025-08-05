
'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { User, Swords } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { getFirebaseClient } from '@/lib/firebase/client';
import { CharacterCard } from '@/components/character-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Character } from '@/types/character';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';


function CharacterListSkeleton() {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-auto w-full aspect-square rounded-lg" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    );
}

export default function CharactersPage() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    
    const { db } = getFirebaseClient();
    const q = query(
      collection(db, 'characters'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCharacters: Character[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Character',
          description: data.description || '',
          biography: data.biography || '',
          imageUrl: data.imageUrl || '',
          userId: data.userId,
          status: data.status === 'public' ? 'public' : 'private',
          createdAt: createdAtDate,
        };
      });
      setCharacters(newCharacters);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching characters:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.main
        className="flex-1 p-4 md:p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="mx-auto grid w-full max-w-6xl gap-2 mb-8">
          <h1 className="text-3xl font-semibold font-headline tracking-wider">My Characters</h1>
          <p className="text-muted-foreground">A gallery of all the characters you have forged.</p>
        </div>
        
        {loading ? (
            <CharacterListSkeleton />
        ) : characters.length > 0 ? (
            <motion.div 
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
              <AnimatePresence>
                {characters.map((character) => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </AnimatePresence>
            </motion.div>
        ) : (
            <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                <User className="h-16 w-16 mb-4 text-primary/70" />
                <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">Your Gallery is Empty</h2>
                <p className="max-w-xs mx-auto mb-6">It looks like you haven't forged any characters yet. Let's bring your first legend to life!</p>
                <Link href="/character-generator" className={cn(buttonVariants({ size: 'lg' }), "bg-accent text-accent-foreground hover:bg-accent/90")}>
                    <Swords className="mr-2 h-5 w-5" />
                    Forge a New Character
                </Link>
            </div>
        )}
      </motion.main>
  );
}
