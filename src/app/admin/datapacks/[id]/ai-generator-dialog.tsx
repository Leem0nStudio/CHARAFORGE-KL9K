
'use client';

import { useState, useTransition } from 'react';
import { generateDataPackSchema } from '@/ai/flows/datapack-schema/flow';
import { validateAndSuggestDataPackSlots } from '@/ai/flows/datapack-validator/flow';
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
import { Loader2, Wand2, ArrowRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AiGeneratorDialogProps {
    onSchemaGenerated: (schemaYaml: string) => void;
    onGeneratingChange: (isGenerating: boolean) => void;
}

type Step = 'concept' | 'slots' | 'generate';

export function AiGeneratorDialog({ onSchemaGenerated, onGeneratingChange }: AiGeneratorDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [concept, setConcept] = useState('');
    const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<Step>('concept');
    const { toast } = useToast();
    const [isProcessing, startTransition] = useTransition();

    const resetState = () => {
        setConcept('');
        setSuggestedSlots([]);
        setCurrentStep('concept');
    }
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetState();
        }
        setIsOpen(open);
    }

    const handleSuggestSlots = () => {
        if (!concept.trim()) {
            toast({ variant: 'destructive', title: 'Concept Required', description: 'Please enter a concept before proceeding.' });
            return;
        }

        startTransition(async () => {
            try {
                const result = await validateAndSuggestDataPackSlots({ concept });
                if (result.isValid) {
                    setSuggestedSlots(result.suggestedSlots);
                    setCurrentStep('slots');
                } else {
                    toast({ variant: 'destructive', title: 'Concept Invalid', description: result.feedback });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unexpected response was received from the server.";
                toast({ variant: 'destructive', title: 'Suggestion Failed', description: message });
            }
        });
    }

    const handleToggleSlot = (slot: string) => {
        setSuggestedSlots(prev => 
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
        );
    }
    
    const handleGenerateSchema = () => {
        onGeneratingChange(true);
        startTransition(async () => {
             try {
                const result = await generateDataPackSchema({ concept, schemaSlots: suggestedSlots });
                
                if (!result.schemaYaml) {
                    throw new Error("The AI returned empty or invalid schema content.");
                }
                
                onSchemaGenerated(result.schemaYaml);

                toast({ title: "DataPack Generated!", description: "The AI has populated the form. Please review the results."});
                setIsOpen(false);
                resetState();
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Generation Failed', description: message });
            } finally {
                onGeneratingChange(false);
            }
        });
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                     AI Assistant
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>DataPack AI Assistant: Step {currentStep === 'concept' ? 1 : 2} of 2</AlertDialogTitle>
                     <AlertDialogDescription>
                       {currentStep === 'concept' && 'Describe the theme for your DataPack. Be descriptive for the best results.'}
                       {currentStep === 'slots' && 'Review and select the schema slots (modules) for the AI to generate.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                {currentStep === 'concept' && (
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
                )}
                
                {currentStep === 'slots' && (
                    <div className="py-4">
                        <Label>Suggested Slots</Label>
                        <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md max-h-64 overflow-y-auto">
                           {suggestedSlots.map(slot => (
                               <Badge 
                                key={slot}
                                variant="secondary"
                                className="cursor-pointer text-base py-1 pr-1 pl-2 hover:bg-muted-foreground/20"
                                onClick={() => handleToggleSlot(slot)}
                               >
                                {slot}
                                <X className="ml-2 h-3 w-3"/>
                               </Badge>
                           ))}
                        </div>
                         <p className="text-xs text-muted-foreground mt-1">Click a slot to remove it before generation.</p>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {currentStep === 'concept' && (
                         <AlertDialogAction onClick={handleSuggestSlots} disabled={isProcessing || !concept}>
                            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
                            Next <ArrowRight className="ml-2 h-4 w-4"/>
                        </AlertDialogAction>
                    )}
                    {currentStep === 'slots' && (
                         <AlertDialogAction onClick={handleGenerateSchema} disabled={isProcessing || suggestedSlots.length === 0}>
                            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
                            Generate <Wand2 className="ml-2 h-4 w-4"/>
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
