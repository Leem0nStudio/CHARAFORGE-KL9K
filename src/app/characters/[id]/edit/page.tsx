
import { notFound, redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp } from '@/lib/firebase/server';
import { updateCharacter } from '@/app/characters/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackButton } from '@/components/back-button';

async function getCharacterForEdit(characterId: string) {
  if (!adminDb || !adminApp) {
     return { error: 'SERVICE_UNAVAILABLE' };
  }

  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      return null;
    }

    let uid;
    try {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (error) {
      return null;
    }

    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists || characterDoc.data()?.userId !== uid) {
      return null;
    }

    return characterDoc.data();
  } catch (error) {
    return { error: 'SERVICE_UNAVAILABLE' };
  }
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  const characterData = await getCharacterForEdit(params.id);

  if (characterData?.error === 'SERVICE_UNAVAILABLE') {
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
             <Button variant="outline" asChild className='mt-4 w-fit'>
                <Link href="/characters">Back to My Characters</Link>
            </Button>
        </div>
      </main>
    )
  }

  if (!characterData) {
    notFound();
  }
  
  const updateCharacterWithId = updateCharacter.bind(null, params.id);
  const character = characterData as { name: string, biography: string };

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
                    <form action={updateCharacterWithId} className="space-y-6">
                        <div className="space-y-2">
                           <label htmlFor="name" className="font-semibold text-sm">Character Name</label>
                           <Input 
                                id="name"
                                name="name"
                                defaultValue={character.name}
                                className="w-full"
                                required
                            />
                        </div>
                         <div className="space-y-2">
                           <label htmlFor="biography" className="font-semibold text-sm">Biography</label>
                           <Textarea
                                id="biography"
                                name="biography"
                                defaultValue={character.biography}
                                className="min-h-[200px] w-full"
                                required
                           />
                        </div>
                        <div className="flex justify-end gap-2">
                             <Button variant="outline" asChild>
                                <Link href="/characters">Cancel</Link>
                            </Button>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
