
'use server';

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCharacter } from '@/app/actions/character-read';
import { verifyAndGetUid } from '@/lib/auth/server';
import { BackButton } from '@/components/back-button';
import type { Character } from '@/types/character';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditDetailsTab } from './edit-details-tab';
import { EditGalleryTab } from './edit-gallery-tab';
import { EditVersionsTab } from './edit-versions-tab';
import { EditSharingTab } from './edit-sharing-tab';
import { RpgAttributesTab } from './rpg-attributes-tab';
import { Loader2 } from 'lucide-react';

async function EditCharacterTabs({ characterId, defaultTab }: { characterId: string; defaultTab: string }) {
  let uid: string;
  try {
    uid = await verifyAndGetUid();
  } catch (error) {
    // If auth fails for any reason (expired, invalid, missing cookie), redirect to login.
    redirect('/login?reason=session-expired');
  }

  const character = await getCharacter(characterId);

  if (!character || character.meta.userId !== uid) {
    // If character doesn't exist or doesn't belong to the user, show 404.
    notFound();
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="details">Details & Lore</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="rpg">RPG Attributes</TabsTrigger>
        <TabsTrigger value="versions">Versions</TabsTrigger>
        <TabsTrigger value="sharing">Sharing</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <EditDetailsTab character={character} />
      </TabsContent>
      <TabsContent value="gallery">
        <EditGalleryTab character={character} />
      </TabsContent>
      <TabsContent value="rpg">
        <RpgAttributesTab character={character} />
      </TabsContent>
      <TabsContent value="versions">
        <EditVersionsTab character={character} />
      </TabsContent>
      <TabsContent value="sharing">
        <EditSharingTab character={character} />
      </TabsContent>
    </Tabs>
  );
}

export default async function EditCharacterPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const defaultTab = searchParams?.tab === 'sharing' ? 'sharing' : 'details';

  return (
    <div className="container py-8">
      <BackButton
        title="Character Workshop"
        description="Refine, regenerate, and manage every aspect of your creation."
      />
      <div className="max-w-4xl mx-auto mt-8">
        <Suspense fallback={
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
          <EditCharacterTabs characterId={params.id} defaultTab={defaultTab} />
        </Suspense>
      </div>
    </div>
  );
}
