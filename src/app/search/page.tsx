
'use server';

import { searchCharactersByTag } from '@/app/actions/creations';
import { BackButton } from '@/components/back-button';
import { CharacterCard } from '@/components/character/character-card';
import { Badge } from '@/components/ui/badge';
import { getSlotColorClass } from '@/lib/app-config';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';

interface SearchPageProps {
    searchParams: {
        tag?: string;
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { tag } = searchParams;
    const searchResults = tag ? await searchCharactersByTag(tag) : [];

    const title = tag ? `Results for "${tag}"` : "Search";
    const description = tag ? `Explore all the creations that match this tag.` : "Please specify a tag to search for.";

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

            <div className="max-w-7xl mx-auto">
                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {searchResults.map(character => (
                            <CharacterCard key={character.id} character={character} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-card/50">
                        <p>No characters found with the tag <Badge variant="outline" className={cn('ml-1 mr-1', getSlotColorClass(tag || ''))}>{tag}</Badge>.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
