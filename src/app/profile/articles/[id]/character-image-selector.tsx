
'use client';

import { useState, useEffect } from 'react';
import { getCharacters } from '@/app/actions/character-read';
import type { Character } from '@/types/character';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface CharacterImageSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onImageSelect: (url: string) => void;
}

export function CharacterImageSelectorDialog({ isOpen, onClose, onImageSelect }: CharacterImageSelectorProps) {
    const { authUser } = useAuth();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCharacterUrl, setSelectedCharacterUrl] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState('');

    useEffect(() => {
        if (isOpen && authUser) {
            setIsLoading(true);
            getCharacters(authUser.id)
                .then(setCharacters)
                .catch(() => console.error("Failed to fetch characters for selector"))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, authUser]);

    const handleSelect = () => {
        if (selectedCharacterUrl) {
            onImageSelect(selectedCharacterUrl);
            onClose();
        }
    };
    
    const handleExternalUrlInsert = () => {
        if (externalUrl) {
            onImageSelect(externalUrl);
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Insert Image</DialogTitle>
                    <DialogDescription>Select an image from one of your characters or paste an external URL.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="characters" className="flex-grow flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="characters">From My Characters</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="characters" className="flex-grow mt-4 min-h-0">
                        <ScrollArea className="h-full pr-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {characters.map(char => (
                                        <div key={char.id} className="relative cursor-pointer group" onClick={() => setSelectedCharacterUrl(char.visuals.imageUrl)}>
                                            <Image 
                                                src={char.visuals.imageUrl} 
                                                alt={char.core.name}
                                                width={200}
                                                height={200}
                                                className="w-full aspect-square object-cover rounded-md"
                                            />
                                            {selectedCharacterUrl === char.visuals.imageUrl && (
                                                <div className="absolute inset-0 bg-primary/70 flex items-center justify-center rounded-md">
                                                    <Check className="h-12 w-12 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="url" className="mt-4">
                        <div className="space-y-4">
                            <Input 
                                placeholder="https://example.com/image.png"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                            />
                            <Button onClick={handleExternalUrlInsert} disabled={!externalUrl}>Insert from URL</Button>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter className="mt-4 border-t pt-4">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSelect} disabled={!selectedCharacterUrl}>Insert Selected</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
