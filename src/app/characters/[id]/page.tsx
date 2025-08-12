
'use server';

import { notFound } from 'next/navigation';
import { CharacterPageClient } from './client';
import { getCharacter } from '@/app/actions/character-read';
import { getCreationsForDataPack } from '@/app/actions/datapacks';
import { getUserProfile } from '@/app/actions/user';
import { getUserSettings } from '@/app/actions/admin';
import type { Character } from '@/types/character';
import { verifyAndGetUid } from '@/lib/auth/server';


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

  const [userProfile, userSettings, creationsForDataPack] = await Promise.all([
    getUserProfile(character.userId),
    getUserSettings(),
    character.dataPackId ? getCreationsForDataPack(character.dataPackId) : Promise.resolve([]),
  ]);

  // Filter out the current character from the related creations
  const filteredCreations = creationsForDataPack.filter((c: Character) => c.id !== character.id);

  const showAdminFeatures = userSettings?.enableAdminFeatures || false;

  return (
    <CharacterPageClient
      character={character}
      userProfile={currentUserId ? await getUserProfile(currentUserId) : null}
      showAdminFeatures={showAdminFeatures}
      creationsForDataPack={filteredCreations}
    />
  );
}
