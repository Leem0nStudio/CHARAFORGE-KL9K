

'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import type { UserProfile } from '@/types/user';
import type { AiModel } from '@/types/ai-model';
import type { CharacterBibleResult, CharacterBibleInput } from '@/app/character-generator/actions';
import { generateCharacterCore, generateCharacterPortrait } from '@/app/character-generator/actions';
import { saveCharacter } from '@/app/actions/character-write';
import { expandTemplate } from '@/services/composition';

import { useToast } from '@/hooks/use-toast';
import { getModels } from '@/app/actions/ai-models';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, ArrowRight, Save, Image as ImageIcon, Stars, Package } from 'lucide-react';
import { ModelSelectorModal } from './model-selector-modal';
import { VisualModelSelector } from './visual-model-selector';
import { DataPackSelector } from './datapack-selector';
import { geminiImagePlaceholder } from '@/lib/app-config';
import { PromptEditor } from './prompt-editor';
import { useRouter } from 'next/navigation';
import type { DataPack, PromptTemplate } from '@/types/datapack';
import { CharacterRevealScreen } from './character/character-reveal-screen';
import { v4 as uuidv4 } from 'uuid';

const coreFormSchema = z.object({
  prompt: z.string().min(10, { message: 'Please provide a more detailed description.' }),
});

type CoreFormValues = z.infer<typeof coreFormSchema>;

type GenerationStep = 'prompt' | 'portrait';

// Helper function to convert data URI to File object
function dataURItoFile(dataURI: string, filename: string): File {
    const arr = dataURI.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URI');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

export function CharacterGenerator({ authUser }: { authUser: UserProfile | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingCore, startCoreTransition] = useTransition();
  const [isLoadingPortrait, startPortraitTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();

  // State Management
  const [generationStep, setGenerationStep] = useState<GenerationStep>('prompt');
  const [characterBibleResult, setCharacterBibleResult] = useState<CharacterBibleResult | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [isDataPackWizardOpen, setIsDataPackWizardOpen] = useState(false);
  const [activePack, setActivePack] = useState<DataPack | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  
  // Model Selection
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isLoraModalOpen, setIsLoraModalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [availableLoras, setAvailableLoras] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel>(geminiImagePlaceholder);
  const [selectedLora, setSelectedLora] = useState<AiModel | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Form handling
  const coreForm = useForm<CoreFormValues>({
    resolver: zodResolver(coreFormSchema),
    defaultValues: { prompt: '' }
  });
  
  const promptEditorRef = useRef<{ format: () => void }>(null);


  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const [models, loras] = await Promise.all([getModels('model'), getModels('lora')]);
        setAvailableModels(models);
        setAvailableLoras(loras);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load AI models.' });
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, [toast]);

  const handleGenerateCore = (values: CoreFormValues) => {
    startCoreTransition(async () => {
      const result = await generateCharacterCore({ premise: values.prompt });
      if (result.success && result.data) {
        setCharacterBibleResult(result.data);
        // Skip bio step, go straight to portrait generation
        handleGeneratePortrait(result.data);
      } else {
        toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
      }
    });
  };
  
   const handleGeneratePortrait = async (bibleResult: CharacterBibleResult) => {
        if (!bibleResult) return;
        setGenerationStep('portrait');
        startPortraitTransition(async () => {
            const result = await generateCharacterPortrait({
                description: bibleResult.renderPrompt,
                negativePrompt: bibleResult.negativePrompt,
                selectedModel: selectedModel,
                selectedLora: selectedLora,
                aspectRatio: '1:1',
                backgroundStyle: 'scenic',
                userApiKey: authUser?.preferences?.huggingFaceApiKey,
            });
            if (result.success && result.imageUrl) {
                setFinalImageUrl(result.imageUrl);
                setShowReveal(true);
                setTimeout(() => setShowReveal(false), 4000); 
            } else {
                toast({ variant: 'destructive', title: 'Image Generation Failed', description: result.error });
                 setGenerationStep('prompt'); // Go back to prompt on failure
            }
        });
    };

    const handleSave = () => {
        if (!characterBibleResult || !finalImageUrl) return;
        
        startSavingTransition(async () => {
             try {
                // Convert Data URI to File object on the client-side
                const imageFile = dataURItoFile(finalImageUrl, `${uuidv4()}.png`);

                const result = await saveCharacter({
                    bible: characterBibleResult.bible,
                    dataPackId: activePack?.id,
                    textEngine: 'gemini',
                    imageEngine: selectedModel.engine,
                    wizardData: coreForm.watch('prompt') === characterBibleResult.renderPrompt ? null : coreForm.getValues(),
                    originalPrompt: coreForm.getValues('prompt')
                }, imageFile);

                if(result.success && result.characterId) {
                    toast({ title: 'Character Forged!', description: 'Your new character has been saved to your Armory.' });
                    router.push(`/characters/${result.characterId}/edit`);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                 const message = error instanceof Error ? error.message : "An unknown error occurred.";
                 toast({ variant: 'destructive', title: 'Save Failed', description: message });
            }
        });
    }
    
    const handleDataPackSelect = (pack: DataPack) => {
        setActivePack(pack);
        setSelectedTemplate(pack.schema.promptTemplates[0] || null);
    };

    const handleWizardComplete = (wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => {
        const expandedPrompt = expandTemplate(template.template, wizardData);
        
        const cleanedPrompt = expandedPrompt
          .replace(/ ,/g, ',')
          .replace(/, ,/g, ',')
          .replace(/,,/g, ',')
          .trim();

        coreForm.setValue('prompt', cleanedPrompt);
        setGenerationStep('prompt');
        setIsDataPackWizardOpen(false);
    };

    const handleBackFromWizard = () => {
        setIsDataPackWizardOpen(false);
        setActivePack(null);
        setSelectedTemplate(null);
    };

    if (isDataPackWizardOpen) {
        return activePack && selectedTemplate ? (
             <DataPackSelector.Wizard 
                pack={activePack}
                selectedTemplate={selectedTemplate}
                onTemplateChange={(name) => setSelectedTemplate(activePack.schema.promptTemplates.find(t => t.name === name) || null)}
                onWizardComplete={handleWizardComplete}
                onBack={handleBackFromWizard}
             />
        ) : (
            <DataPackSelector onSelectPack={handleDataPackSelect} onBack={handleBackFromWizard} />
        );
    }

    const isLoading = isLoadingCore || isLoadingPortrait;

  return (
    <>
      <AnimatePresence>
        {showReveal && finalImageUrl && <CharacterRevealScreen imageUrl={finalImageUrl} />}
      </AnimatePresence>

      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSelect={setSelectedModel}
        type="model"
        models={availableModels}
        isLoading={isLoadingModels}
      />
      <ModelSelectorModal
        isOpen={isLoraModalOpen}
        onClose={() => setIsLoraModalOpen(false)}
        onSelect={setSelectedLora}
        type="lora"
        models={availableLoras}
        isLoading={isLoadingModels}
      />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Left Column: Form & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>The Forge</span>
             <Button variant="outline" size="sm" onClick={() => setIsDataPackWizardOpen(true)} disabled={isLoading}>
                 <Package className="mr-2"/> DataPack Wizard
             </Button>
          </CardTitle>
           <CardDescription>
                Use a simple prompt or the DataPack Wizard to start, then refine your prompt before generating the portrait.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={coreForm.handleSubmit(handleGenerateCore)} className="space-y-4">
                 <PromptEditor
                    ref={promptEditorRef}
                    value={coreForm.watch('prompt')}
                    onChange={(newVal) => coreForm.setValue('prompt', newVal)}
                    disabled={isLoading}
                    activePack={activePack}
                    selectedTemplate={selectedTemplate}
                    onTemplateChange={(name) => {
                        if(activePack) {
                            setSelectedTemplate(activePack.schema.promptTemplates.find(t => t.name === name) || null);
                        }
                    }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VisualModelSelector label="Base Model" model={selectedModel} onOpen={() => setIsModelModalOpen(true)} disabled={isLoading} isLoading={isLoadingModels} />
                    <VisualModelSelector label="LoRA (Optional)" model={selectedLora} onOpen={() => setIsLoraModalOpen(true)} disabled={isLoading} isLoading={isLoadingModels} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <ImageIcon className="mr-2"/>}
                    Forge Portrait
                </Button>
            </form>
        </CardContent>
      </Card>

      {/* Right Column: Results */}
        <div className="space-y-4 sticky top-24">
        <AnimatePresence>
            {finalImageUrl && !showReveal && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative aspect-square w-full rounded-lg overflow-hidden border shadow-lg"
                >
                    <Image src={finalImageUrl} alt="Generated Character Portrait" fill className="object-cover" />
                </motion.div>
            )}
             {isLoadingPortrait && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative aspect-square w-full rounded-lg overflow-hidden border bg-muted/50 flex items-center justify-center"
                 >
                     <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
                        <p>Forging portrait...</p>
                     </div>
                 </motion.div>
            )}
        </AnimatePresence>
        {finalImageUrl && !showReveal && (
             <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2"/>}
                Save Character
            </Button>
        )}
        </div>
    </div>
    </>
  );
}

    