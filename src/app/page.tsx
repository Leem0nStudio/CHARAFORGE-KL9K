
import { getPublicCharacters, getTopCreators } from '@/app/actions';
import { HomePageClient } from '@/components/home-page-client';

export default async function Home() {
    // Fetch characters and creators on the server side
    const featuredCharacters = await getPublicCharacters();
    const topCreators = await getTopCreators();

    // Pass the prepared data to the client component
    return <HomePageClient 
                featuredCreations={featuredCharacters} 
                topCreators={topCreators} 
            />;
}
