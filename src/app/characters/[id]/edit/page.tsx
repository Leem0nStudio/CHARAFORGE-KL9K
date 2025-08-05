
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp } from '@/lib/firebase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackButton } from '@/components/back-button';
import { EditCharacterForm } from './edit-character-form';
import type { Character } from '@/types/character';


async function getCharacterForEdit(characterId: string): Promise<{ character: Character | null; error?: string }> {
  if (!adminDb || !adminApp) {
     return { character: null, error: 'SERVICE_UNAVAILABLE' };
  }

  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      return { character: null };
    }

    let uid;
    try {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (error) {
      return { character: null };
    }

    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      return { character: null };
    }
    
    const data = characterDoc.data();
    if (!data) return { character: null };

    const character: Character = {
        id: characterDoc.id,
        name: data.name,
        description: data.description,
        biography: data.biography,
        imageUrl: data.imageUrl,
        userId: data.userId,
        status: data.status,
        createdAt: data.createdAt.toDate(),
    };


    return { character };
  } catch (error) {
    return { character: null, error: 'SERVICE_UNAVAILABLE' };
  }
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  const { character, error } = await getCharacterForEdit(params.id);

  if (error === 'SERVICE_UNAVAILABLE') {
    return (
       <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-2xl gap-2">
           <h1 className="text-3xl font-semibold font-headline tracking-wider">Edit Character</h1>
             <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Service Unavailable</AlertTitle>
              <AlertDescription>
                The editing service is currently unavailable due to a server configuration issue. Please try again later.
              </AlertDescription>
            </Alert>
             <Link href="/characters" className="mt-4">Back to My Characters</Link>
        </div>
      </main>
    )
  }

  if (!character) {
    notFound();
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex items-center gap-4">
                <BackButton />
                <h1 className="text-3xl font-semibold font-headline tracking-wider">Edit Character</h1>
            </div>
            <p className="text-muted-foreground">Refine the details of your creation.</p>
           <Card className="mt-4">
                <CardHeader>
                    <CardTitle>{character.name}</CardTitle>
                    <CardDescription>
                        Modify the fields below to update your character. The original description and image cannot be changed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditCharacterForm character={character} />
                </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}

