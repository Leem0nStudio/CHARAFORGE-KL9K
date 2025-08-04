import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { User } from 'lucide-react';
import { adminApp, adminDb } from '@/lib/firebase/server';
import { CharacterCard } from '@/components/character-card';
import { redirect } from 'next/navigation';
import type { Character } from '@/types/character';


async function getCharactersForUser(userId: string): Promise<Character[]> {
  if (!adminDb) {
    return [];
  }
  try {
    const snapshot = await adminDb
      .collection('characters')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
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
  } catch (error: unknown) {
    return [];
  }
}

export default async function CharactersPage() {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    redirect('/login');
  }

  let uid: string;
  try {
      if (!adminApp) {
          throw new Error("Authentication service is not available.");
      }
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (error: unknown) {
    redirect('/login');
  }

  const characters = await getCharactersForUser(uid);

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
