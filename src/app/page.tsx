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

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Character',
        description: data.description || '',
        biography: data.biography || '',
        imageUrl: data.imageUrl || '',
        userId: data.userId,
        status: data.status,
        createdAt: createdAtDate,
        userName: data.userName || 'Anonymous',
      };
    });
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
