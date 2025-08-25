
'use client';

import type { Character } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GachaCard } from '../character/gacha-card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Swords } from 'lucide-react';

interface CharacterSelectorProps {
    characters: Character[];
    onSelectCharacter: (character: Character) => void;
}

export function CharacterSelector({ characters, onSelectCharacter }: CharacterSelectorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Choose Your Champion</CardTitle>
                <CardDescription>Select one of your playable characters to enter the arena.</CardDescription>
            </CardHeader>
            <CardContent>
                {characters.length > 0 ? (
                    <ScrollArea className="h-[60vh]">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pr-4">
                            {characters.map(char => (
                                <div key={char.id} onClick={() => onSelectCharacter(char)} className="cursor-pointer">
                                    <GachaCard character={char} disableLink={true} />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50 flex flex-col items-center justify-center">
                        <Swords className="h-16 w-16 mb-4 text-primary/70" />
                        <h3 className="text-xl font-medium font-headline tracking-wider mb-2">No Champions Available</h3>
                        <p className="max-w-xs mx-auto mb-6">
                            You don't have any characters ready for battle. A character must have a class and generated stats to be playable.
                        </p>
                        <Button asChild>
                            <Link href="/characters">Go to Your Characters</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
