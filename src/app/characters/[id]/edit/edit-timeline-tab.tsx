'use client';

import { useTransition } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character, TimelineEvent } from '@/types/character';
import { updateCharacterTimeline } from '@/app/actions/characters';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const TimelineEventSchema = z.object({
    id: z.string(),
    date: z.string().min(1, 'Date is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
});

const TimelineFormSchema = z.object({
    timeline: z.array(TimelineEventSchema),
});

type TimelineFormValues = z.infer<typeof TimelineFormSchema>;

export function EditTimelineTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
    const { toast } = useToast();
    const [isUpdating, startUpdateTransition] = useTransition();

    const form = useForm<TimelineFormValues>({
        resolver: zodResolver(TimelineFormSchema),
        defaultValues: {
            timeline: character.timeline || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'timeline',
    });

    const handleSaveTimeline = (data: TimelineFormValues) => {
        startUpdateTransition(async () => {
            const result = await updateCharacterTimeline(character.id, data.timeline);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                onUpdate({ timeline: data.timeline });
                form.reset(data); // Reset dirty state
            }
        });
    };
    
    const addNewEvent = () => {
        append({ id: uuidv4(), date: '', title: '', description: '' });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Character Timeline</CardTitle>
                <CardDescription>
                    Map out the key events in your character's life. Add moments, relationships, and turning points.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(handleSaveTimeline)} className="space-y-6">
                    <div className="space-y-4">
                        {fields.length > 0 ? (
                            fields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-muted/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`timeline.${index}.date`}>Date / Age</Label>
                                            <Input
                                                id={`timeline.${index}.date`}
                                                {...form.register(`timeline.${index}.date`)}
                                                placeholder="e.g., Age 25, Year of the Comet"
                                            />
                                            {form.formState.errors.timeline?.[index]?.date && <p className="text-sm text-destructive">{form.formState.errors.timeline[index].date.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`timeline.${index}.title`}>Event Title</Label>
                                            <Input
                                                id={`timeline.${index}.title`}
                                                {...form.register(`timeline.${index}.title`)}
                                                placeholder="The Coronation"
                                            />
                                            {form.formState.errors.timeline?.[index]?.title && <p className="text-sm text-destructive">{form.formState.errors.timeline[index].title.message}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                         <Label htmlFor={`timeline.${index}.description`}>Description</Label>
                                         <Textarea
                                            id={`timeline.${index}.description`}
                                            {...form.register(`timeline.${index}.description`)}
                                            placeholder="Describe what happened during this event..."
                                         />
                                        {form.formState.errors.timeline?.[index]?.description && <p className="text-sm text-destructive">{form.formState.errors.timeline[index].description.message}</p>}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                            <Trash2 className="mr-2 h-4 w-4"/> Remove Event
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <p>No timeline events added yet. Start by adding the character's birth or a major life event.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button type="button" variant="outline" onClick={addNewEvent} disabled={isUpdating}>
                            <Plus className="mr-2" /> Add Event
                        </Button>
                        <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Timeline
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}