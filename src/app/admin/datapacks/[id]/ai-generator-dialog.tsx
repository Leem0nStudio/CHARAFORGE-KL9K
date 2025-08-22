
'use client';

import { useState, useTransition } from 'react';
import { generateDataPackSchema } from '@/ai/flows/datapack-schema/flow';
import type { GenerateDataPackSchemaOutput } from '@/ai/flows/datapack-schema/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import type { CharacterProfileSchema } from '@/types/datapack';

interface AiGeneratorDialogProps {
    onSchemaGenerated: (schema: Partial<CharacterProfileSchema>, tags: string[]) => void;
}

/**
 * Transforms a flat list of slots from the AI into the nested CharacterProfileSchema.
 * @param slots The flat array of slots from the AI.
 * @returns A nested CharacterProfileSchema object.
 */
function reconstructSchema(slots: GenerateDataPackSchemaOutput['slots']): Partial<CharacterProfileSchema> {
    const schema: any = {};
    for (const slot of slots) {
        const parts = slot.id.split('.');
        if (parts.length === 2) {
            const [parent, child] = parts;
            if (!schema[parent]) {
                schema[parent] = {};
            }
            schema[parent][child] = slot.options;
        } else {
            schema[slot.id] = slot.options;
        }
    }
    return schema;
}


export function AiGeneratorDialog({ onSchemaGenerated }: AiGeneratorDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, startTransition] = useTransition();
    const [concept, setConcept] = useState('');
    const { toast } = useToast();

    const handleGenerate = () => {
        if (!concept) return;
        startTransition(async () => {
            try {
                const result = await generateDataPackSchema({ concept });
                const reconstructed = reconstructSchema(result.slots);
                onSchemaGenerated(reconstructed, result.tags);
                toast({ title: "Schema Generated!", description: "The AI has populated the schema editor. Please review the results."});
                setIsOpen(false);
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Generation Failed', description: message });
            }
        });
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="outline"><Wand2 className="mr-2" /> AI Assistant</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>DataPack AI Assistant</AlertDialogTitle>
                    <AlertDialogDescription>
                        Describe the theme or concept for your DataPack, and the AI will generate a complete schema for you. Be descriptive for the best results.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <Label htmlFor="concept">Concept</Label>
                    <Textarea 
                        id="concept"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g., Sci-Fi Noir Detectives in a rain-slicked megacity, Elemental Dragons with ancient, warring clans, or Lovecraftian Horror Investigators in 1920s New England."
                        className="min-h-[100px]"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerate} disabled={isGenerating || !concept}>
                        {isGenerating && <Loader2 className="mr-2 animate-spin" />}
                        Generate
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
