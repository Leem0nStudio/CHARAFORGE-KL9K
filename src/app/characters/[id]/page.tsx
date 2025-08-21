

'use server';

import { notFound } from 'next/navigation';
import { getCharacter } from '@/app/actions/character-read';
import { verifyAndGetUid } from '@/lib/auth/server';
import { ShowcaseViewer } from '@/components/showcase/showcase-viewer';

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const character = await getCharacter(params.id);
  if (!character) {
    notFound();
  }

  let currentUserId: string | null = null;
  try {
    currentUserId = await verifyAndGetUid();
  } catch(e) {
    // User is not logged in, which is fine for public pages
  }

  // If the character is not public and the viewer is not the owner, deny access.
  if (character.meta.status !== 'public' && currentUserId !== character.meta.userId) {
      notFound();
  }

  return (
    <ShowcaseViewer 
      character={character}
      currentUserId={currentUserId}
    />
  );
}
    
