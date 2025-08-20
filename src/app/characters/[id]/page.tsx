

'use server';

import { notFound } from 'next/navigation';
import { CharacterPageClient } from './client';
import { getCharacter } from '@/app/actions/character-read';
import { getCreationsForDataPack } from '@/app/actions/datapacks';
import type { Character } from '@/types/character';
import { verifyAndGetUid } from '@/lib/auth/server';

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const character = await getCharacter(params.id);
  if (!character) {
    notFound();
  }

  let currentUserId: string | null = null;
  try {
    // This will succeed if the user is logged in, and fail otherwise.
    // We catch the error to allow anonymous users to view public pages.
    currentUserId = await verifyAndGetUid();
  } catch(e) {
    // User is not logged in, which is fine for public pages
  }

  const [creationsForDataPack] = await Promise.all([
    character.meta.dataPackId ? getCreationsForDataPack(character.meta.dataPackId) : Promise.resolve([]),
  ]);

  // If the character is not public and the viewer is not the owner, deny access.
  if (character.meta.status !== 'public' && currentUserId !== character.meta.userId) {
      notFound();
  }

  // Filter out the current character from the related creations
  const filteredCreations = creationsForDataPack.filter((c: Character) => c.id !== character.id);

  return (
    <CharacterPageClient
      character={character}
      currentUserId={currentUserId}
      creationsForDataPack={filteredCreations}
    />
  );
}
