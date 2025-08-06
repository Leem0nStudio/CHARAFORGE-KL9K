
import { getPublicCharacters } from '@/app/actions';
import { HomePageClient } from '@/components/home-page-client';

export default async function Home() {
    // Fetch characters on the server side
    const featuredCharacters = await getPublicCharacters();

    // Pass the prepared data to the client component
    return <HomePageClient featuredCreations={featuredCharacters} />;
}
