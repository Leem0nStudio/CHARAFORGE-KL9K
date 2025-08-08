import { getPublicCharacters, getTopCreators } from '@/app/actions/creations';
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { HomePageClient } from '@/components/home-page-client';

export default async function Home() {
    const featuredCharacters = await getPublicCharacters();
    const topCreators = await getTopCreators();
    const newDataPacks = await getPublicDataPacks();

    return <HomePageClient 
                featuredCreations={featuredCharacters} 
                topCreators={topCreators} 
                newDataPacks={newDataPacks}
            />;
}
