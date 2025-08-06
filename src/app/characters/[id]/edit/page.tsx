
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

  // 1. Get Character data first. Exit early if it doesn't exist.
  const characterRef = adminDb.collection('characters').doc(characterId);
  const characterDoc = await characterRef.get();

  if (!characterDoc.exists) {
    notFound();
  }
  
  const characterData = characterDoc.data();
  if (!characterData) {
     notFound();
  }

  // 2. Verify user identity and admin status
  let uid: string | null = null;
  let isAdmin = false;

  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (idToken) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      // Check admin status from the same decoded token if the claim is present
      isAdmin = decodedToken.admin === true;
    }
  } catch (error) {
    // If token verification fails, user is treated as unauthenticated and non-admin
    uid = null;
    isAdmin = false;
  }
  
  // 3. Check for authorization
  const isOwner = characterData.userId === uid;
  
  // User must be the owner OR an admin to proceed.
  if (!isOwner && !isAdmin) {
    notFound();
  }
  
  // 4. If authorized, build and return the character object
  const character: Character = {
      id: characterDoc.id,
      name: characterData.name,
      description: characterData.description,
      biography: characterData.biography,
      imageUrl: characterData.imageUrl,
      gallery: characterData.gallery || [characterData.imageUrl], // Fallback for old data model
      userId: characterData.userId,
      status: characterData.status,
      createdAt: characterData.createdAt.toDate(),
  };

  return character;
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  try {
    const character = await getCharacterForEdit(params.id);
    
    return (
      <div className="container py-8">
          <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
              <div className="flex items-center gap-4">
                  <BackButton />
                  <div>
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">Edit Character</h1>
                    <p className="text-muted-foreground">Refine the details of your creation, translate its story, or expand its gallery.</p>
                  </div>
              </div>
          </div>
          <div className="max-w-7xl mx-auto">
            <EditCharacterForm character={character} />
          </div>
      </div>
    );
  } catch (error) {
     // This will catch errors from getCharacterForEdit if it throws an exception
     // (like Firebase services being down), but not 'notFound()' calls.
     console.error("Failed to render edit page:", error);
     // Re-throwing is important to let Next.js handle the server error boundary.
     throw error;
  }
}
