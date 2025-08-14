
'use server';

import { searchCharactersByTag } from '@/app/actions/creations';
import { searchDataPacksByTag } from '@/app/actions/datapacks';
import { BackButton } from '@/components/back-button';
import { CharacterCard } from '@/components/character/character-card';
import { DataPackCard } from '@/components/datapack/datapack-card';
import { Badge } from '@/components/ui/badge';
import { getSlotCategory } from '@/lib/app-config';
import { Swords, Package, Tag } from 'lucide-react';

interface SearchPageProps {
    searchParams: {
        tag?: string;
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { tag } = searchParams;

    if (!tag) {
        return (
             <div className="container py-8">
                <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight font-headline">Search</h1>
                            <p className="text-muted-foreground">Please provide a tag in the URL to search.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const [characterResults, dataPackResults] = await Promise.all([
        searchCharactersByTag(tag),
        searchDataPacksByTag(tag)
    ]);
    
    const hasCharacterResults = characterResults.length > 0;
    const hasDataPackResults = dataPackResults.length > 0;
    const hasResults = hasCharacterResults || hasDataPackResults;
    
    const title = `Results for "${tag}"`;
    const description = `Explore all creations and DataPacks matching this tag.`;

    return (
        <div className="container py-8">
             <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                             <Tag className="h-8 w-8 text-primary" />
                             {title}
                        </h1>
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-12">
                {hasCharacterResults && (
                    <section>
                         <h2 className="text-2xl font-headline flex items-center gap-2 mb-4">
                             <Swords /> Characters Found
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {characterResults.map(character => (
                                <CharacterCard key={character.id} character={character} />
                            ))}
                        </div>
                    </section>
                )}

                {hasDataPackResults && (
                     <section>
                         <h2 className="text-2xl font-headline flex items-center gap-2 mb-4">
                             <Package /> Related DataPacks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dataPackResults.map(pack => (
                                <DataPackCard key={pack.id} pack={pack} />
                            ))}
                        </div>
                    </section>
                )}
                
                {!hasResults && (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-card/50">
                        <div>No characters or datapacks found with the tag <Badge variant="outline" data-category={getSlotCategory(tag || '')} className="ml-1 mr-1">{tag}</Badge>.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
