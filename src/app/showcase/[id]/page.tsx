
'use server';

import { notFound } from 'next/navigation';
import { getCharacter } from '@/app/actions/character-read';
import { getCharacterLikeStatus } from '@/app/actions/social';
import { verifyAndGetUid } from '@/lib/auth/server';
import { GenshinLikeShowcase } from '@/components/showcase/genshin-like-showcase';
import { getComments } from '@/app/actions/comments';

export default async function ShowcasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = await getCharacter(id);
  if (!character) {
    notFound();
  }

  let currentUserId: string | null = null;
  let isLiked = false;
  try {
    currentUserId = await verifyAndGetUid();
    isLiked = await getCharacterLikeStatus(character.id, currentUserId);
  } catch(e) {
    // User is not logged in, which is fine for public pages
  }

  // If the character is not public and the viewer is not the owner, deny access.
  if (character.meta.status !== 'public' && currentUserId !== character.meta.userId) {
      notFound();
  }
  
  const initialComments = await getComments('character', id);

  return (
    <GenshinLikeShowcase
      character={character}
      currentUserId={currentUserId}
      isLikedInitially={isLiked}
      initialComments={initialComments}
    />
  );
}
