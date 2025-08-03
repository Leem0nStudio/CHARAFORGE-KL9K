import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// Opt out of caching for this dynamic route
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Server database is not configured.' },
      { status: 500 }
    );
  }

  try {
    const snapshot = await adminDb
      .collection('characters')
      .where('status', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(50) // Limit to 50 public characters for this API endpoint
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const publicCharacters = snapshot.docs.map(doc => {
      const data = doc.data();
      // Selectively expose public data, omitting sensitive info like userId
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        biography: data.biography,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt.toDate().toISOString(),
        userName: data.userName || 'Anonymous',
      };
    });

    return NextResponse.json(publicCharacters);
  } catch (error) {
    console.error('Error fetching public characters for API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
