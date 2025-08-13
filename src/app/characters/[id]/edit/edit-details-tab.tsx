
'use client';

import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character } from '@/types/character';
import { updateCharacter } from '@/app/actions/character-write';
import { generateCharacterSheet } from '@/ai/flows/character-sheet/flow';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import type { TextEngineConfig } from '@/ai/utils/llm-utils';

const alignmentOptions = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good', 
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
] as const;

const FormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
  alignment: z.enum(alignmentOptions),
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
            name: character.name,
            biography: character.biography,
            alignment: character.alignment || 'True Neutral',
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
                // This is where we could, in the future, let the user choose a text model.
                const textEngineConfig: TextEngineConfig = {
                    engineId: 'gemini',
                    modelId: 'googleai/gemini-1.5-flash-latest',
                };
                const result = await generateCharacterSheet({ 
                    description: character.description, 
                    engineConfig: textEngineConfig 
                });
                form.setValue('biography', result.biography, { shouldDirty: true });
                toast({
                    title: 'Biography Regenerated!',
                    description: 'A new biography has been generated. Don\'t forget to save your changes.',
                });
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
                <CardDescription>Modify the fields below to update your character's story.</CardDescription>
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
                    </div>
                   
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="biography">Biography</Label>
                             <Button type="button" variant="outline" size="sm" onClick={handleRegenerateBio} disabled={isRegenerating}>
                                {isRegenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                Regenerate
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
