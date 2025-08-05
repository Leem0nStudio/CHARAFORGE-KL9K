
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { User, Swords, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getFirebaseClient } from '@/lib/firebase/client';
import { CharacterCard } from '@/components/character-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Character } from '@/types/character';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { LoginButton } from '@/components/login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackButton } from '@/components/back-button';


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
  const { authUser, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return; // Wait until auth state is resolved
    }
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    setLoading(true);
    const { db } = getFirebaseClient();
    const q = query(
      collection(db, 'characters'),
      where('userId', '==', authUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCharacters(prevCharacters => {
        const newCharacters = [...prevCharacters];
        let hasChanged = false;

        snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            const character: Character = {
                id: change.doc.id,
                name: data.name || 'Unnamed Character',
                description: data.description || '',
                biography: data.biography || '',
                imageUrl: data.imageUrl || '',
                userId: data.userId,
                status: data.status === 'public' ? 'public' : 'private',
                createdAt: createdAtDate,
            };

            if (change.type === "added") {
                if (!newCharacters.find(c => c.id === character.id)) {
                    // Find correct position based on createdAt
                    const index = newCharacters.findIndex(c => c.createdAt < character.createdAt);
                    if (index === -1) {
                        newCharacters.push(character);
                    } else {
                        newCharacters.splice(index, 0, character);
                    }
                    hasChanged = true;
                }
            }
            if (change.type === "modified") {
                const index = newCharacters.findIndex(c => c.id === character.id);
                if (index !== -1) {
                    newCharacters[index] = character;
                    hasChanged = true;
                }
            }
            if (change.type === "removed") {
                const index = newCharacters.findIndex(c => c.id === character.id);
                if (index !== -1) {
                    newCharacters.splice(index, 1);
                    hasChanged = true;
                }
            }
        });
        
        return hasChanged ? newCharacters : prevCharacters;
      });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching characters:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, authLoading, router]);
  
  if (authLoading) {
     return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-40 w-full border-b bg-background">
         <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <Link href="/" className="flex items-center gap-2">
                <Bot className="h-6 w-6 mr-2 text-primary" />
                <span className="font-bold font-headline text-2xl tracking-wider">CharaForge</span>
            </Link>
           <div className="flex flex-1 items-center justify-end space-x-4">
             <nav className="flex items-center space-x-1">
               <LoginButton />
               <ThemeToggle />
             </nav>
           </div>
         </div>
       </header>
       <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-4 mb-8">
           <div className="flex items-center gap-4">
              <BackButton />
              <div className='flex flex-col'>
                <h1 className="text-3xl font-semibold font-headline tracking-wider">My Characters</h1>
                <p className="text-muted-foreground">A gallery of all the characters you have forged.</p>
              </div>
          </div>
        </div>
        
        {loading ? (
            <CharacterListSkeleton />
        ) : characters.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {characters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
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
      </main>
    </div>
  );
}
