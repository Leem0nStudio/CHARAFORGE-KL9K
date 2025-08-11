
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Character } from '@/types/character';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditDetailsTab } from './edit-details-tab';
import { EditGalleryTab } from './edit-gallery-tab';
import { EditVersionsTab } from './edit-versions-tab';
import { EditSharingTab } from './edit-sharing-tab';
import { EditTimelineTab } from './edit-timeline-tab';

export function EditCharacterForm({ character }: { character: Character }) {
    const [characterState, setCharacterState] = useState(character);
    const router = useRouter();

    useEffect(() => {
        setCharacterState(character);
    }, [character]);
    
    const handleCharacterUpdate = (data: Partial<Character>) => {
        setCharacterState(prev => ({ ...prev, ...data }));
        router.refresh(); // Re-fetches server data and re-renders
    };
    
    // This function will be passed down to child components that need to update the gallery
    const handleGalleryUpdate = (newGallery: string[], newPrimaryImage?: string) => {
        setCharacterState(prev => ({ 
            ...prev, 
            gallery: newGallery, 
            imageUrl: newPrimaryImage || prev.imageUrl // Only update primary if provided
        }));
        router.refresh();
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Image Gallery */}
            <div className="lg:sticky lg:top-20">
                <EditGalleryTab 
                    character={characterState} 
                    onGalleryUpdate={handleGalleryUpdate} 
                />
            </div>
            
            {/* Right Column: Edit Tabs */}
            <div className="w-full">
                <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="versions">Versions</TabsTrigger>
                        <TabsTrigger value="sharing">Sharing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details">
                       <EditDetailsTab 
                            character={characterState} 
                            onUpdate={handleCharacterUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="timeline">
                        <EditTimelineTab 
                            character={characterState}
                            onUpdate={handleCharacterUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="versions">
                        <EditVersionsTab 
                            character={characterState}
                            onUpdate={handleCharacterUpdate}
                        />
                    </TabsContent>

                    <TabsContent value="sharing">
                        <EditSharingTab
                            character={characterState}
                            onUpdate={handleCharacterUpdate}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

    