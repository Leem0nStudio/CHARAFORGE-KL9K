
'use server';

import { getPublicCharacters, getTopCreators } from '@/app/actions/creations';
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { HomePageClient } from '@/components/home-page-client';
import type { Character } from '@/types/character';

export default async function Home() {
    const [featuredCharacters, topCreators, newDataPacks] = await Promise.all([
        getPublicCharacters(),
        getTopCreators(),
        getPublicDataPacks(),
    ]);

    // Optimize hero character selection on the server
    const heroCharacter = (() => {
        if (featuredCharacters.length === 0) return null;
        const lastFive = featuredCharacters.slice(0, 5);
        return lastFive[Math.floor(Math.random() * lastFive.length)];
    })();


    return (
        <HomePageClient 
            featuredCreations={featuredCharacters} 
            topCreators={topCreators} 
            newDataPacks={newDataPacks}
            heroCharacter={heroCharacter}
        />
    );
}
