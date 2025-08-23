
'use server';

import { getPublicCharacters, getTopCreators } from '@/app/actions/creations';
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { getPublishedArticles } from '@/app/actions/articles';
import { HomePageClient } from '@/components/home-page-client';
import type { Character } from '@/types/character';

export default async function Home() {
    const [featuredCharacters, topCreators, newDataPacks, latestArticles] = await Promise.all([
        getPublicCharacters(),
        getTopCreators(),
        getPublicDataPacks(),
        getPublishedArticles(),
    ]);

    // Optimize hero character selection on the server
    const heroCharacter = (() => {
        if (featuredCharacters.length === 0) return null;
        // Prefer a higher-rarity character for the hero section
        const sortedByRarity = [...featuredCharacters].sort((a, b) => (b.core.rarity || 0) - (a.core.rarity || 0));
        return sortedByRarity[0];
    })();


    return (
        <HomePageClient 
            featuredCreations={featuredCharacters} 
            topCreators={topCreators} 
            newDataPacks={newDataPacks}
            latestArticles={latestArticles.slice(0, 3)} // Pass only the 3 most recent articles
            heroCharacter={heroCharacter}
        />
    );
}
