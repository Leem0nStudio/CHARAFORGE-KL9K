
'use server';

import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, adminApp } from '@/lib/firebase/server';
import { BackButton } from '@/components/back-button';
import type { Character } from '@/types/character';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditDetailsTab } from './edit-details-tab';
import { EditGalleryTab } from './edit-gallery-tab';
import { EditVersionsTab } from './edit-versions-tab';
import { EditSharingTab } from './edit-sharing-tab';
import { EditTimelineTab } from './edit-timeline-tab';


async function getCharacterForEdit(characterId: string): Promise<Character> {
  if (!adminDb || !adminApp) {
     throw new Error('Firebase Admin services are not available.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  const characterDoc = await characterRef.get();

  if (!characterDoc.exists) {
    notFound();
  }
  
  const characterData = characterDoc.data();
  if (!characterData) {
     notFound();
  }

  let uid: string | null = null;
  let isAdmin = false;

  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      notFound();
    }
    
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    uid = decodedToken.uid;
    isAdmin = decodedToken.admin === true;
    
  } catch (error) {
    console.error("Auth verification failed in getCharacterForEdit:", error);
    notFound();
  }
  
  const isOwner = characterData.userId === uid;
  
  if (!isOwner && !isAdmin) {
    notFound();
  }
  
  const character: Character = {
      id: characterDoc.id,
      name: characterData.name,
      description: characterData.description,
      biography: characterData.biography,
      imageUrl: characterData.imageUrl,
      gallery: characterData.gallery || [characterData.imageUrl],
      userId: characterData.userId,
      status: characterData.status,
      createdAt: characterData.createdAt.toDate(),
      isSharedToDataPack: characterData.isSharedToDataPack,
      dataPackId: characterData.dataPackId,
      version: characterData.version || 1,
      versionName: characterData.versionName || `v.${characterData.version || 1}`,
      baseCharacterId: characterData.baseCharacterId || null,
      versions: characterData.versions || [{ id: characterDoc.id, name: characterData.versionName || 'v.1', version: characterData.version || 1 }],
      branchingPermissions: characterData.branchingPermissions || 'private',
      alignment: characterData.alignment || 'True Neutral',
      timeline: characterData.timeline || [],
      tags: characterData.tags || [],
  };

  return character;
}

export default async function EditCharacterPage({ params }: { params: { id: string } }) {
  try {
    const character = await getCharacterForEdit(params.id);
    
    return (
      <div className="container py-8">
          <BackButton 
              title="Character Workshop"
              description="Refine, regenerate, and manage every aspect of your creation."
          />
          <div className="max-w-4xl mx-auto mt-8">
              <Tabs defaultValue="gallery" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                    <TabsTrigger value="sharing">Sharing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="gallery">
                    <EditGalleryTab character={character} />
                </TabsContent>
                <TabsContent value="details">
                    <EditDetailsTab character={character} />
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
     console.error("Failed to render edit page:", error);
     throw error;
  }
}
