

'use server';

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
import { EditTimelineTab } from './edit-timeline-tab';


async function getCharacterForEdit(characterId: string): Promise<Character> {
  let uid: string;
  try {
      uid = await verifyAndGetUid();
  } catch (error) {
      redirect('/login');
  }

  const character = await getCharacter(characterId);

  if (!character) {
    notFound();
  }
  
  if (character.meta.userId !== uid) {
     // Optional: Check for admin role here if admins should be able to edit
     notFound();
  }
  
  return character;
}

export default async function EditCharacterPage({ 
    params,
    searchParams 
}: { 
    params: { id: string },
    searchParams?: { [key: string]: string | string[] | undefined }
}) {
  try {
    // The call to the async function is already awaited, satisfying Next.js's requirements.
    const character = await getCharacterForEdit(params.id);
    const defaultTab = searchParams?.tab === 'sharing' ? 'sharing' : 'details';
    
    return (
      <div className="container py-8">
          <BackButton 
              title="Character Workshop"
              description="Refine, regenerate, and manage every aspect of your creation."
          />
          <div className="max-w-4xl mx-auto mt-8">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                    <TabsTrigger value="sharing">Sharing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                    <EditDetailsTab character={character} />
                </TabsContent>
                <TabsContent value="gallery">
                    <EditGalleryTab character={character} />
                </TabsContent>
                <TabsContent value="timeline">
                    <EditTimelineTab character={character} />
                </TabsContent>
                <TabsContent value="versions">
                    <EditVersionsTab character={character} />
                </TabsContent>
                <TabsContent value="sharing">
                    <EditSharingTab character={character} />
                </TabsContent>
              </Tabs>
          </div>
      </div>
    );
  } catch (error) {
     if ((error as any)?.digest?.includes('NEXT_NOT_FOUND')) {
        notFound();
     }
     console.error("Failed to render edit page:", error);
     throw error;
  }
}
