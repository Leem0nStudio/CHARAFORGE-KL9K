import { Suspense } from 'react';
import { getCharacters } from '@/app/actions/character-read';
import { ArenaClient } from './arena-client';
import { Loader2 } from 'lucide-react';

async function ArenaPageContent() {
    // Fetch all characters and then filter for playable ones.
    const allCharacters = await getCharacters();
    const playableCharacters = allCharacters.filter(c => c.rpg.isPlayable && c.rpg.statsStatus === 'complete');
    
    // For now, we'll create a static list of opponents. This could come from a DB later.
    const opponents = allCharacters.filter(c => c.rpg.isPlayable && c.rpg.statsStatus === 'complete' && c.meta.status === 'public').slice(0, 10);

    return <ArenaClient userCharacters={playableCharacters} opponents={opponents} />;
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
