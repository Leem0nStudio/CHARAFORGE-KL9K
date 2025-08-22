
'use client';

import { useState, useTransition } from 'react';
import { generateDataPackSchema } from '@/ai/flows/datapack-schema/flow';
import { useToast } from '@/hooks/use-toast';
import * as yaml from 'js-yaml';
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
import type { DataPackSchema } from '@/types/datapack';


interface AiGeneratorDialogProps {
    onSchemaGenerated: (data: {
        name: string;
        description: string;
        tags: string[];
        schema: DataPackSchema;
    }) => void;
    onGeneratingChange: (isGenerating: boolean) => void;
}

export function AiGeneratorDialog({ onSchemaGenerated, onGeneratingChange }: AiGeneratorDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [concept, setConcept] = useState('');
    const { toast } = useToast();
    const [isGenerating, startTransition] = useTransition();

    const handleGenerate = () => {
        if (!concept) return;
        onGeneratingChange(true);
        startTransition(async () => {
            try {
                const result = await generateDataPackSchema({ concept });
                
                // Robust YAML parsing: remove document separators '---' to handle cases where the AI includes them.
                const cleanedYaml = result.yamlContent.replace(/---\s*/g, '');
                const parsedSchema = yaml.load(cleanedYaml) as any;
                
                if (!parsedSchema || !parsedSchema.characterProfileSchema) {
                    throw new Error("The AI returned invalid or empty YAML content for the schema.");
                }

                const finalSchema: DataPackSchema = {
                    promptTemplates: parsedSchema.promptTemplates || [],
                    characterProfileSchema: parsedSchema.characterProfileSchema || {},
                };
                
                onSchemaGenerated({
                    name: result.name,
                    description: result.description,
                    tags: result.tags || [],
                    schema: finalSchema,
                });

                toast({ title: "DataPack Generated!", description: "The AI has populated the form. Please review the results."});
                setIsOpen(false);
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Generation Failed', description: message });
                console.error("YAML Parsing or Generation Error:", error);
            } finally {
                onGeneratingChange(false);
            }
        });
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                     AI Assistant
                </Button>
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
