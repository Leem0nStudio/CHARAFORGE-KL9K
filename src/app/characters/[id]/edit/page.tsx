
'use server';

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCharacter } from '@/app/actions/character-read';
import { verifyAndGetUid } from '@/lib/auth/server';
import { BackButton } from '@/components/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditDetailsTab } from './edit-details-tab';
import { EditGalleryTab } from './edit-gallery-tab';
import { EditVersionsTab } from './edit-versions-tab';
import { EditSharingTab } from './edit-sharing-tab';
import { RpgAttributesTab } from './rpg-attributes-tab';
import { Loader2 } from 'lucide-react';
import type { AsyncParams } from '@/types/next';

async function EditCharacterTabs({ characterId, defaultTab }: { characterId: string; defaultTab: string }) {
  let uid: string;
  try {
    // First, verify authentication. If this fails, it will throw,
    // and the error boundary will catch it correctly, redirecting to login.
    uid = await verifyAndGetUid();
  } catch (error) {
    // The most common error from verifyAndGetUid is a session issue.
    redirect('/login?reason=session-expired');
  }

  // If authentication succeeds, proceed to fetch the character data.
  const character = await getCharacter(characterId);

  // Now, check if the character exists and belongs to the authenticated user.
  if (!character || character.meta.userId !== uid) {
    // If not, trigger a 404 Not Found page.
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

// This page now correctly uses AsyncParams and handles searchParams inside the component.
export default async function EditCharacterPage({
  params,
  searchParams,
}: AsyncParams<{ id: string }> & { searchParams?: { [key:string]: string | string[] | undefined }}) {
  const { id } = await params;
  const defaultTab = typeof searchParams?.tab === 'string' ? searchParams.tab : 'details';
  const validTabs = ['details', 'gallery', 'rpg', 'versions', 'sharing'];
  const finalDefaultTab = validTabs.includes(defaultTab) ? defaultTab : 'details';

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
          <EditCharacterTabs characterId={id} defaultTab={finalDefaultTab} />
        </Suspense>
      </div>
    </div>
  );
}
