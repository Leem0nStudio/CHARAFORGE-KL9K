
'use server';

import { Suspense } from 'react';
import { getCharacters } from '@/app/actions/character-read';
import { CharacterGallery } from './character-gallery';
import { Loader2 } from 'lucide-react';
import { verifyAndGetUid } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function CharactersPage() {
  let uid: string;
  try {
    uid = await verifyAndGetUid();
  } catch (error) {
    redirect('/login');
  }

  const characters = await getCharacters(uid);
  
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center h-screen w-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    }>
        <CharacterGallery initialCharacters={characters} />
    </Suspense>
  );
}
