import { getFirebaseClient } from '@/lib/firebase/client';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import { HomePageClient } from '@/components/home-page-client';

async function getFeaturedCharacters(): Promise<Character[]> {
  if (!adminDb) {
    return [];
  }
  try {
    const snapshot = await adminDb
      .collection('characters')
      .where('status', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(4)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const characters = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      
      let userName = 'Anonymous';
      if (data.userId) {
        try {
          const userDoc = await adminDb.collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            userName = userDoc.data()?.displayName || 'Anonymous';
          }
        } catch (userError) {
           if (process.env.NODE_ENV !== 'production') {
              console.error(`Failed to fetch user ${data.userId}`, userError);
           }
        }
      }

      return {
        id: doc.id,
        name: data.name || 'Unnamed Character',
        description: data.description || '',
        biography: data.biography || '',
        imageUrl: data.imageUrl || '',
        userId: data.userId,
        status: data.status,
        createdAt: createdAtDate,
        userName: userName,
      };
    }));

    return characters;

  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching featured characters:", error);
    }
    return [];
  }
}

export default async function Home() {
  const featuredCreations = await getFeaturedCharacters();

  return <HomePageClient featuredCreations={featuredCreations} />;
}
