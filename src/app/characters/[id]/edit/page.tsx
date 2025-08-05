
import { notFound, redirect } from 'next/navigation';
import { adminDb, adminApp } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { BackButton } from '@/components/back-button';
import { EditCharacterForm } from './edit-character-form';
import type { Character } from '@/types/character';


async function getCharacterForEdit(characterId: string): Promise<Character> {
  if (!adminDb || !adminApp) {
     // If server services aren't ready, it's a server issue, not a "not found" case.
     // Throwing an error here is more appropriate for debugging.
     throw new Error('Firebase Admin services are not available.');
  }

  // 1. Get User UID first, this is the most common point of failure.
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
    // If token verification fails, treat as unauthenticated.
    uid = null;
  }
  
  // If no user is logged in, they can't edit anything.
  if (!uid) {
    // Redirecting to login is better than showing a 404.
    redirect('/login');
  }

  // 2. Get Character Document
  const characterRef = adminDb.collection('characters').doc(characterId);
  const characterDoc = await characterRef.get();

  if (!characterDoc.exists) {
    // Character genuinely does not exist.
    notFound();
  }
  
  const data = characterDoc.data();
  if (!data) {
     // Should not happen if doc exists, but as a safeguard.
     notFound();
  }

  // 3. Verify Ownership or Admin role
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
        // Failed to get user record, so they are not an admin.
        isAdmin = false;
    }
  }
  
  // If the user is not the owner AND not an admin, they are not authorized.
  if (!isOwner && !isAdmin) {
    notFound();
  }
  
  // 4. If all checks pass, return the character data.
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
  // The try-catch block is important here. If getCharacterForEdit throws an error
  // (like services unavailable), we can handle it gracefully. `notFound()` will be
  // caught by Next.js automatically.
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
     // This will catch the "Firebase Admin services are not available" error
     // and show a generic server error page, which is better than a 404.
     console.error("Failed to render edit page:", error);
     // You could render a dedicated error component here.
     // For now, re-throwing will let Next.js handle it.
     throw error;
  }
}
