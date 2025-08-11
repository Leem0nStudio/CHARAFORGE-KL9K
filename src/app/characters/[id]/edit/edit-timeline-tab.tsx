
'use client';

import { useTransition } from 'react';
import type { Character, TimelineEvent } from '@/types/character';
import { updateCharacterTimeline } from '@/app/actions/characters';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function EditTimelineTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
    const { toast } = useToast();
    const [isUpdating, startUpdateTransition] = useTransition();

    // Placeholder for form logic which will be added in a future step
    const timeline = character.timeline || [];

    const handleSaveTimeline = () => {
        // This function will eventually take the updated timeline data from a form
        startUpdateTransition(async () => {
            const result = await updateCharacterTimeline(character.id, timeline);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                onUpdate({ timeline });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Character Timeline</CardTitle>
                <CardDescription>
                    Map out the key events in your character's life. Add moments, relationships, and turning points.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {timeline.length > 0 ? (
                        timeline.map(event => (
                            <div key={event.id} className="border p-4 rounded-lg">
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-sm text-muted-foreground">{event.date}</p>
                                <p className="mt-2 text-sm">{event.description}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>No timeline events added yet.</p>
                        </div>
                    )}
                </div>
                 <div className="flex justify-between items-center pt-4 border-t">
                     <Button type="button" variant="outline">
                        <Plus className="mr-2" /> Add Event
                    </Button>
                    <Button onClick={handleSaveTimeline} disabled={isUpdating}>
                        Save Timeline
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
