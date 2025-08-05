
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp } from '@/lib/firebase/server';
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
      // Not logged in, so can't be authorized.
      return { character: null, error: 'NOT_AUTHENTICATED' };
    }

    let uid;
    try {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (error) {
       // Token is invalid or expired.
      return { character: null, error: 'NOT_AUTHENTICATED' };
    }

    const characterRef = adminDb.collection('characters').doc(characterId);
    const characterDoc = await characterRef.get();

    if (!characterDoc.exists) {
        return { character: null, error: 'NOT_FOUND' };
    }
    
    const data = characterDoc.data();
    if (!data) return { character: null, error: 'NOT_FOUND' };
    
    // The user must own the character to edit it.
    if (data.userId !== uid) {
      // As an extra security measure, also check if the user is an admin.
      const auth = getAuth(adminApp);
      const userRecord = await auth.getUser(uid);
      if (!userRecord.customClaims?.admin) {
        return { character: null, error: 'NOT_AUTHORIZED' };
      }
    }

    const character: Character = {
        id: characterDoc.id,
        name: data.name,
        description: data.description,
        biography: data.biography,
        imageUrl: data.imageUrl,
        gallery: data.gallery || [data.imageUrl], // Fallback for old data model
        userId: data.userId,
        status: data.status,
        createdAt: data.createdAt.toDate(),
    };


    return { character };
  } catch (error) {
    console.error("Error in getCharacterForEdit: ", error);
    return { character: null, error: 'SERVICE_UNAVAILABLE' };
  }
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  const { character, error } = await getCharacterForEdit(params.id);

  if (error || !character) {
      // Handle all error cases centrally, redirecting to notFound for security.
      // This prevents leaking information about why access was denied.
      notFound();
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-4xl gap-4">
            <div className="flex items-center gap-4">
                <BackButton />
                <h1 className="text-3xl font-semibold font-headline tracking-wider">Edit Character</h1>
            </div>
            <p className="text-muted-foreground">Refine the details of your creation, translate its story, or expand its gallery.</p>
           <div className="mt-4">
             <EditCharacterForm character={character} />
           </div>
        </div>
      </main>
    </div>
  );
}
