
'use server';

import { getPublicCharacters, getTopCreators } from '@/app/actions/creations';
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { HomePageClient } from '@/app/home-page-client';
import type { Character } from '@/types/character';

export default async function Home() {
    const [featuredCharacters, topCreators, newDataPacks] = await Promise.all([
        getPublicCharacters(),
        getTopCreators(),
        getPublicDataPacks(),
    ]);

    return (
        <HomePageClient 
            featuredCreations={featuredCharacters} 
            topCreators={topCreators} 
            newDataPacks={newDataPacks}
        />
    );
}
