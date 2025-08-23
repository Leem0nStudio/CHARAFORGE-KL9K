
import { Suspense } from 'react';
import { getCharacters } from '@/app/actions/character-read';
import { ArenaClient } from './arena-client';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

async function ArenaPageContent() {
    // Fetch all characters and then filter for playable ones.
    const allCharacters = await getCharacters();
    const playableCharacters = allCharacters.filter(c => c.rpg.isPlayable && c.rpg.statsStatus === 'complete');
    
    if (playableCharacters.length === 0) {
        // This is a better user experience than showing an empty selector.
        // We can create a dedicated component for this state.
        // For now, the client will handle the "no characters" state gracefully.
    }

    // Opponents are now fetched dynamically inside BattleView, so we don't pass them here.
    return <ArenaClient userCharacters={playableCharacters} />;
}


export default function ArenaPage() {
    return (
        <Suspense fallback={
             <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ArenaPageContent />
        </Suspense>
    );
}
