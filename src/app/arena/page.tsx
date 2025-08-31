'use server';

import { Suspense } from 'react';
import { getCharacters } from '@/app/actions/character-read';
import { ArenaClient } from './arena-client';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { verifyAndGetUid } from '@/lib/auth/server';

export default async function ArenaPage() {
    let uid: string;
    try {
        // Secure the page by verifying the user session first.
        uid = await verifyAndGetUid();
    } catch (error) {
        // If verifyAndGetUid throws (no session), redirect to login.
        redirect('/login?reason=unauthenticated');
    }
    
    // Fetch all characters and then filter for playable ones.
    const allCharacters = await getCharacters(uid);
    const playableCharacters = allCharacters.filter(c => c.rpg.isPlayable && c.rpg.statsStatus === 'complete');
    
    return (
        <Suspense fallback={
             <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ArenaClient userCharacters={playableCharacters} />
        </Suspense>
    );
}
