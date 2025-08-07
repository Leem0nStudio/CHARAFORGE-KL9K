import { getPublicCharacters, getTopCreators } from '@/app/actions/creations';
import { HomePageClient } from '@/components/home-page-client';

export default async function Home() {
    const featuredCharacters = await getPublicCharacters();
    const topCreators = await getTopCreators();

    return <HomePageClient 
                featuredCreations={featuredCharacters} 
                topCreators={topCreators} 
            />;
}
