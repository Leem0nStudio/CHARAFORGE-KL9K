
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { getFirebaseClient } from '@/lib/firebase/client';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import type { Character } from '@/types/character';
import { HomePageClient } from '@/components/home-page-client';


async function getFeaturedCharacters(): Promise<Character[]> {
  const { db } = getFirebaseClient();
  if (!db) {
    console.error("Firestore client is not available.");
    return [];
  };

  try {
    const charactersRef = collection(db, 'characters');
    const q = query(
      charactersRef,
      where('status', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(4)
    );

    const querySnapshot = await getDocs(q);
    const charactersData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as Character));
    
    // Fetch user names for each character
    const charactersWithUserNames = await Promise.all(
        charactersData.map(async (character) => {
            if (character.userId) {
                const userDocRef = doc(db, 'users', character.userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    return { ...character, userName: userDoc.data().displayName || 'Anonymous' };
                }
            }
            return { ...character, userName: 'Anonymous' };
        })
    );
    
    return charactersWithUserNames;

  } catch (error) {
    console.error("Error fetching featured characters:", error);
    // In a real app, you might want to log this to a service
    return [];
  }
}


export default function Home() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharacters = async () => {
            const featuredCharacters = await getFeaturedCharacters();
            setCharacters(featuredCharacters);
            setLoading(false);
        };

        fetchCharacters();
    }, []);

    if (loading) {
      // You can return a skeleton loader here if you want
      // For now, we'll just show the client component which has its own internal loading states if needed
    }

    return <HomePageClient featuredCreations={characters} />;
}
