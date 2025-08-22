

'use client';

import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character } from '@/types/character';
import { updateCharacter } from '@/app/actions/character-write';
import { regenerateCharacterSheet } from '@/app/actions/generation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const alignmentOptions = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good', 
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
] as const;

const FormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  archetype: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
  alignment: z.enum(alignmentOptions),
  physicalDescription: z.string().optional(),
  rarity: z.number().min(1).max(5),
});
type FormValues = z.infer<typeof FormSchema>;

export function EditDetailsTab({ character }: { character: Character }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, startUpdateTransition] = useTransition();
    const [isRegenerating, startRegenerateTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: character.core.name,
            archetype: character.core.archetype || '',
            equipment: character.core.equipment || [],
            biography: character.core.biography,
            alignment: character.core.alignment || 'True Neutral',
            physicalDescription: character.core.physicalDescription || character.generation?.originalPrompt,
            rarity: character.core.rarity || 3,
        },
    });

    const onSubmit = (data: FormValues) => {
        startUpdateTransition(async () => {
            const result = await updateCharacter(character.id, data);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                router.refresh();
            }
        });
    };

    const handleRegenerateBio = () => {
        startRegenerateTransition(async () => {
            try {
                const originalPrompt = character.generation.originalPrompt || '';
                if (!originalPrompt) {
                    toast({ variant: 'destructive', title: 'Missing Context', description: 'Cannot regenerate without an original prompt.' });
                    return;
                }
                const result = await regenerateCharacterSheet(originalPrompt, 'English');

                if (result.success && result.data) {
                    form.setValue('biography', result.data.biography || '', { shouldDirty: true });
                    form.setValue('physicalDescription', result.data.physicalDescription || '', { shouldDirty: true });
                    toast({
                        title: 'Content Regenerated!',
                        description: 'A new biography and physical description have been generated. Don\'t forget to save your changes.',
                    });
                } else {
                    throw new Error(result.error || 'The AI failed to return valid content.');
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Generation Failed', description: message });
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Core Details</CardTitle>
                <CardDescription>Modify the fields below to update your character's story and attributes.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="name">Character Name</Label>
                            <Input id="name" {...form.register('name')} />
                            {form.formState.errors.name && <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="archetype">Archetype</Label>
                            <Input id="archetype" {...form.register('archetype')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alignment">Alignment</Label>
                            <Controller
                                name="alignment"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {alignmentOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.alignment && <p className="text-sm font-medium text-destructive">{form.formState.errors.alignment.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="equipment">Equipment (comma-separated)</Label>
                            <Controller
                                name="equipment"
                                control={form.control}
                                render={({ field }) => (
                                    <Input
                                        id="equipment"
                                        value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                        onChange={(e) => field.onChange(e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    
                     <div className="space-y-3">
                        <Label htmlFor="rarity">Rarity</Label>
                        <Controller
                            name="rarity"
                            control={form.control}
                            render={({ field }) => (
                                <RadioGroup
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={String(field.value)}
                                    className="grid grid-cols-5 gap-2"
                                >
                                {[1, 2, 3, 4, 5].map(rarity => (
                                    <Label key={rarity} htmlFor={`rarity-${rarity}`} className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === rarity && "border-primary")}>
                                        <RadioGroupItem value={String(rarity)} id={`rarity-${rarity}`} className="sr-only" />
                                        <div className="flex">
                                            {Array.from({length: rarity}).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                                        </div>
                                    </Label>
                                ))}
                                </RadioGroup>
                            )}
                        />
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="physicalDescription">Physical Description (for Image Generation)</Label>
                        <Textarea id="physicalDescription" {...form.register('physicalDescription')} className="min-h-[150px] w-full" />
                    </div>
                   
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="biography">Biography</Label>
                             <Button type="button" variant="outline" size="sm" onClick={handleRegenerateBio} disabled={isRegenerating}>
                                {isRegenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                Regenerate All Text
                            </Button>
                        </div>
                        <Textarea id="biography" {...form.register('biography')} className="min-h-[250px] w-full" />
                        {form.formState.errors.biography && <p className="text-sm font-medium text-destructive">{form.formState.errors.biography.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Details
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
