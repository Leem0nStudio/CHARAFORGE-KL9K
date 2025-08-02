import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { User, Copy, BookOpen, Trash2, Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { admin } from '@/lib/firebase/server';
import { Separator } from '@/components/ui/separator';
import { CharacterCard } from '@/components/character-card';
import type { Character } from '@/components/character-card';
import { redirect } from 'next/navigation';


async function getCharactersForUser(userId: string): Promise<Character[]> {
  try {
    const snapshot = await admin.firestore()
      .collection('characters')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        biography: data.biography,
        imageUrl: data.imageUrl,
        userId: data.userId,
        status: data.status,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (error) {
    console.error("Error fetching characters:", error);
    return [];
  }
}

export default async function CharactersPage() {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;
  let characters: Character[] = [];
  let uid: string | null = null;

  if (idToken) {
    try {
      const decodedToken = await getAuth(admin).verifyIdToken(idToken);
      uid = decodedToken.uid;
      characters = await getCharactersForUser(uid);
    } catch (error) {
      console.error('Auth error, redirecting:', error);
      // If token is invalid, redirect to home
      redirect('/');
    }
  } else {
    // If no token, redirect to home
    redirect('/');
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2 mb-8">
          <h1 className="text-3xl font-semibold font-headline tracking-wider">My Characters</h1>
          <p className="text-muted-foreground">A gallery of all the characters you have forged.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {characters.length > 0 ? (
              characters.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card">
                  <User className="h-12 w-12 mb-4 text-primary" />
                  <p className="text-lg font-medium font-headline tracking-wider">No characters yet</p>
                  <p className="text-sm">Go to the homepage to start creating!</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
