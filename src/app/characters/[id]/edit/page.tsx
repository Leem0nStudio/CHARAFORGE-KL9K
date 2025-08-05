
import { notFound } from 'next/navigation';
import { adminDb, adminApp } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { BackButton } from '@/components/back-button';
import { EditCharacterForm } from './edit-character-form';
import type { Character } from '@/types/character';


async function getCharacterForEdit(characterId: string): Promise<Character> {
  if (!adminDb || !adminApp) {
     throw new Error('Firebase Admin services are not available.');
  }

  let uid: string | null = null;
  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (idToken) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    }
  } catch (error) {
    uid = null;
  }
  
  // If no user is logged in, they can't edit anything. Treat it as not found.
  if (!uid) {
    notFound();
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  const characterDoc = await characterRef.get();

  if (!characterDoc.exists) {
    notFound();
  }
  
  const data = characterDoc.data();
  if (!data) {
     notFound();
  }

  const isOwner = data.userId === uid;
  let isAdmin = false;

  if (!isOwner) {
    try {
        const auth = getAuth(adminApp);
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.admin === true) {
            isAdmin = true;
        }
    } catch(error) {
        isAdmin = false;
    }
  }
  
  if (!isOwner && !isAdmin) {
    notFound();
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

  return character;
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  try {
    const character = await getCharacterForEdit(params.id);
    
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
  } catch (error) {
     console.error("Failed to render edit page:", error);
     throw error;
  }
}
