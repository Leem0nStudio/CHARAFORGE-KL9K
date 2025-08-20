
"use client";

import { useState, useEffect, useCallback, useTransition, use } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText, Save, AlertCircle, Image as ImageIcon, Check, Package, Square, RectangleHorizontal, RectangleVertical, Tags, Settings, User, Pilcrow, Shield, Swords, Info, Text, GripVertical, ChevronDown, Star, CaseSensitive } from "lucide-react";

import { 
    Button,
    Card, CardContent, CardDescription, CardHeader, CardTitle,
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
    Input,
    Textarea,
    Alert, AlertDescription, AlertTitle,
    Badge,
    RadioGroup, RadioGroupItem,
    Slider,
    Tabs, TabsContent, TabsList, TabsTrigger,
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
    ScrollArea,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Label,
} from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { saveCharacter } from "@/app/actions/character-write";
import { generateCharacterSheetData, generateCharacterPortrait } from "@/app/actions/generation";
import { getModels } from "@/app/actions/ai-models";
import { getDataPackForAdmin } from "@/app/actions/datapacks";
import { Skeleton } from "./ui/skeleton";
import { DataPackSelectorModal } from "./datapack-selector-modal";
import { cn } from "@/lib/utils";
import { TagAssistantModal } from "./tag-assistant-modal";
import { ModelSelectorModal } from './model-selector-modal';
import type { AiModel } from '@/types/ai-model';
import { VisualModelSelector } from "./visual-model-selector";
import type { GenerateCharacterSheetOutput } from "@/ai/flows/character-sheet/types";
import { PromptTagInput } from "./prompt-tag-input";
import type { DataPack, PromptTemplate, Option, Slot } from "@/types/datapack";
import { imageModels, textModels, geminiImagePlaceholder } from "@/lib/app-config";
import type { User as FirebaseUser } from "firebase/auth";


const generationFormSchema = z.object({
  description: z.string().min(10, {
    message: "Please enter a more detailed description or use a datapack.",
  }).max(4000, {
    message: "Description must not be longer than 4000 characters."
  }),
  wizardData: z.record(z.string()).optional(),
  physicalDescription: z.string().optional(),
  tags: z.string().optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  selectedModel: z.custom<AiModel>().refine(data => !!data, {
    message: "A base model must be selected.",
  }),
  selectedLora: z.custom<AiModel>().optional().nullable(),
  loraWeight: z.number().min(0).max(2).optional(),
  rarity: z.number().min(1).max(5).default(3),
});

type GenerationResult = GenerateCharacterSheetOutput & {
  imageUrl?: string | null;
  dataPackId?: string | null;
  textEngine?: 'gemini' | 'openrouter';
  imageEngine?: 'gemini' | 'openrouter' | 'huggingface' | 'vertexai' | 'comfyui' | 'modelslab';
};

export function CharacterGenerator({ authUser }: { authUser: FirebaseUser | null }) {
  const searchParams = useSearchParams();
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [initialPack, setInitialPack] = useState<DataPack | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelModalType, setModelModalType] = useState<'model' | 'lora' | 'text'>('model');
  
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [availableLoras, setAvailableLoras] = useState<AiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [selectedTextModel, setSelectedTextModel] = useState<AiModel>(textModels[0]);
  const [promptMode, setPromptMode] = useState<'tags' | 'text'>('tags');

  const [activePack, setActivePack] = useState<DataPack | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  
  const { toast } = useToast();
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const generationForm = useForm<z.infer<typeof generationFormSchema>>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      description: "",
      physicalDescription: "",
      tags: "",
      targetLanguage: 'English',
      aspectRatio: '1:1',
      loraWeight: 0.75,
      selectedModel: imageModels[0] || undefined,
      selectedLora: null,
      rarity: 3,
    },
  });

  const handleWizardDataChange = useCallback((wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => {
    let promptParts: string[] = [];
    const usedPlaceholders = new Set<string>();

    if (template.tags) {
        template.tags.forEach(tagOrPlaceholder => {
            const match = tagOrPlaceholder.match(/\{(.+?)\}/);
            if (match) {
                const slotId = match[1];
                const selectedValue = wizardData[slotId];
                if (selectedValue) {
                    promptParts.push(selectedValue);
                    usedPlaceholders.add(slotId);
                }
            } else {
                promptParts.push(tagOrPlaceholder);
            }
        });
    }

    // Append values from slots that were NOT in the template, to ensure all selections are included.
    for (const slot of pack.schema.slots) {
        if (!usedPlaceholders.has(slot.id) && wizardData[slot.id]) {
            promptParts.push(wizardData[slot.id]);
        }
    }
    
    const finalPrompt = promptParts.join(', ');

    generationForm.setValue('description', finalPrompt, { shouldValidate: true });
    generationForm.setValue('tags', finalPrompt);
    generationForm.setValue('wizardData', wizardData);
    
    setActivePack(pack);
    setSelectedTemplate(template);
    setIsPackModalOpen(false);
}, [generationForm]);
  
  
  useEffect(() => {
    async function loadInitialData() {
        setIsLoadingModels(true);
        try {
            const packIdFromUrl = searchParams.get('packId');
            
            const [userModels, userLoras, initialPackData] = await Promise.all([
                authUser ? getModels('model', authUser.uid) : Promise.resolve([]),
                authUser ? getModels('lora', authUser.uid) : Promise.resolve([]),
                packIdFromUrl ? getDataPackForAdmin(packIdFromUrl) : Promise.resolve(null),
            ]);
            
            const allAvailableModels = new Map<string, AiModel>();
            [geminiImagePlaceholder, ...imageModels, ...userModels].forEach(m => allAvailableModels.set(m.id, m));

            setAvailableModels(Array.from(allAvailableModels.values()));
            setAvailableLoras(userLoras);
            
            const currentModel = generationForm.getValues('selectedModel');
            if (!currentModel || !Array.from(allAvailableModels.values()).find(m => m.id === currentModel.id)) {
                generationForm.setValue('selectedModel', geminiImagePlaceholder);
            }
            
            if (initialPackData) {
                setInitialPack(initialPackData);
                setIsPackModalOpen(true);
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load required data.' });
        } finally {
            setIsLoadingModels(false);
        }
    }
    loadInitialData();
  }, [authUser, toast, generationForm, searchParams]);

  useEffect(() => {
    if (generationResult?.physicalDescription) {
        generationForm.setValue('physicalDescription', generationResult.physicalDescription);
    }
  }, [generationResult, generationForm]);
  

  const handleAppendTags = (tags: string[]) => {
    const currentDesc = generationForm.getValues('description');
    const currentTags = generationForm.getValues('tags') || '';
    
    const newTags = tags.filter(t => !currentDesc.includes(t));
    if (newTags.length > 0) {
        generationForm.setValue('description', `${currentDesc}, ${newTags.join(', ')}`.trim());
    }
    
    const allTags = new Set([...currentTags.split(',').filter(Boolean), ...tags]);
    generationForm.setValue('tags', Array.from(allTags).join(','));
  };

  const onGenerateSheet = useCallback(async (data: z.infer<typeof generationFormSchema>) => {
    if (!authUser) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to generate a character." });
      return;
    }
    
    setGenerationResult(null);
    setGenerationError(null);

    startGenerationTransition(async () => {
        let userApiKey: string | undefined;
        if (selectedTextModel.engine === 'openrouter') {
             userApiKey = userProfile?.preferences?.openRouterApiKey;
        }

      const engineConfig = {
            engineId: selectedTextModel.engine,
            modelId: selectedTextModel.hf_id,
            userApiKey: userApiKey,
      };

      const result = await generateCharacterSheetData({ 
          description: data.description,
          targetLanguage: data.targetLanguage,
          engineConfig: engineConfig,
      });
      
      if (result.success && result.data) {
        setGenerationResult({
          ...result.data,
          dataPackId: activePack?.id,
          textEngine: selectedTextModel.engine,
        });
        toast({ title: "Character Sheet Generated!", description: "Review the details and then generate the portrait." });
      } else {
        const errorMessage = result.error || "An unknown error occurred during generation.";
        setGenerationError(errorMessage);
        toast({ variant: "destructive", title: "Generation Failed", description: errorMessage });
      }
    });
  }, [authUser, toast, activePack, userProfile, selectedTextModel]);
  
  const onGeneratePortrait = useCallback(async () => {
    if (!authUser || !generationResult) return;
    
    startGenerationTransition(async () => {
        const data = generationForm.getValues();
        
        let userApiKey: string | undefined;
        if (data.selectedModel.engine === 'huggingface') {
            userApiKey = userProfile?.preferences?.huggingFaceApiKey;
        } else if (data.selectedModel.engine === 'openrouter') {
            userApiKey = userProfile?.preferences?.openRouterApiKey;
        }

        const result = await generateCharacterPortrait({
             physicalDescription: data.physicalDescription || generationResult.physicalDescription || '',
             aspectRatio: data.aspectRatio,
             selectedModel: data.selectedModel,
             selectedLora: data.selectedLora,
             loraWeight: data.loraWeight,
             userApiKey: userApiKey,
        });
        
        if (result.success && result.imageUrl) {
            setGenerationResult(prev => prev ? { ...prev, imageUrl: result.imageUrl, imageEngine: data.selectedModel.engine } : null);
            toast({ title: "Portrait Generated!", description: "The character image is now ready."});
        } else {
             const errorMessage = result.error || "An unknown error occurred during portrait generation.";
             setGenerationError(errorMessage);
             toast({ variant: "destructive", title: "Portrait Failed", description: errorMessage });
        }
    });
  }, [authUser, toast, generationResult, generationForm, userProfile]);


  async function onSave() {
    if (!generationResult || !generationResult.imageUrl || !authUser) {
         toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Character data is incomplete, image not generated, or you are not logged in.",
        });
        return;
    }
    const formData = generationForm.getValues();

    startSavingTransition(async () => {
      try {
        const result = await saveCharacter({
          name: generationResult.name,
          biography: generationResult.biography || '',
          imageUrl: generationResult.imageUrl!,
          dataPackId: generationResult.dataPackId,
          tags: formData.tags,
          archetype: generationResult.archetype,
          equipment: generationResult.equipment,
          physicalDescription: formData.physicalDescription || generationResult.physicalDescription,
          textEngine: generationResult.textEngine,
          imageEngine: generationResult.imageEngine,
          wizardData: formData.wizardData,
          originalPrompt: generationResult.originalDescription,
          rarity: formData.rarity,
        });

        toast({
          title: "Character Saved!",
          description: `${generationResult.name} has been saved to your gallery.`,
        });
        
        if (result.characterId) {
            router.push(`/characters/${result.characterId}/edit`);
        } else {
            router.push('/characters');
        }

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Could not save your character. Please try again.";
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: errorMessage,
        });
      }
    });
  }
  
  const handleOpenModelModal = (type: 'model' | 'lora' | 'text') => {
      setModelModalType(type);
      setIsModelModalOpen(true);
  }

  const handleModelSelect = (model: AiModel) => {
    if (model.type === 'model' && modelModalType !== 'text') {
        generationForm.setValue('selectedModel', model, { shouldValidate: true });
        if (model.engine !== 'huggingface' && model.engine !== 'vertexai' && model.engine !== 'modelslab') {
            generationForm.setValue('selectedLora', null); 
        }
    } else if (model.type === 'lora') {
        generationForm.setValue('selectedLora', model);
        generationForm.setValue('loraWeight', 0.75);
    } else if (modelModalType === 'text') {
        setSelectedTextModel(model);
    }
    setIsModelModalOpen(false);
  }

  const isUiLoading = isGenerating || isSaving || authLoading || isLoadingModels;
  const canInteract = !isUiLoading && !!authUser;
  const watchDescription = generationForm.watch('description');
  const watchPhysicalDescription = generationForm.watch('physicalDescription');
  const selectedModel = generationForm.watch('selectedModel');
  const selectedLora = generationForm.watch('selectedLora');
  
  const loraCompatible = selectedModel?.engine === 'huggingface' || selectedModel?.engine === 'vertexai' || selectedModel?.engine === 'modelslab';

  return (
    <>
    <DataPackSelectorModal 
      isOpen={isPackModalOpen}
      onClose={() => setIsPackModalOpen(false)}
      onPromptGenerated={handleWizardDataChange}
      initialPack={initialPack}
    />
    <TagAssistantModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onAppendTags={handleAppendTags}
        currentDescription={watchDescription}
    />
    <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSelect={handleModelSelect}
        type={modelModalType}
        models={modelModalType === 'model' ? availableModels : modelModalType === 'text' ? textModels : availableLoras}
        isLoading={isLoadingModels}
    />
    <div className="grid gap-8 lg:grid-cols-5 items-start">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">1. The Forge</CardTitle>
            <CardDescription>
              Provide a description or use a DataPack, then adjust the AI settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...generationForm}>
              <form onSubmit={generationForm.handleSubmit(onGenerateSheet)} className="space-y-6">
                
                <Tabs defaultValue="prompt">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="prompt">Prompt</TabsTrigger>
                        <TabsTrigger value="settings">AI Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="prompt" className="pt-4">
                        <FormField
                          control={generationForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex justify-between items-center mb-2">
                                <FormLabel>Character Concept</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsPackModalOpen(true)}>
                                        <Package className="mr-2 h-3 w-3"/> Use DataPack
                                    </Button>
                                </div>
                              </div>
                               {activePack && selectedTemplate && (
                                    <Select 
                                      onValueChange={(value) => {
                                        const newTemplate = activePack.schema.promptTemplates.find(t => t.name === value);
                                        if (newTemplate) {
                                            handleWizardDataChange(generationForm.getValues('wizardData') || {}, activePack, newTemplate);
                                        }
                                      }}
                                      defaultValue={selectedTemplate.name}
                                    >
                                        <SelectTrigger className="mb-2">
                                            <SelectValue placeholder="Select a prompt template..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activePack.schema.promptTemplates.map(t => (
                                                <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                              <FormControl>
                                  {promptMode === 'tags' ? (
                                    <PromptTagInput 
                                      value={field.value}
                                      onChange={field.onChange}
                                      disabled={!canInteract}
                                    />
                                  ) : (
                                    <Textarea 
                                      {...field}
                                      className="min-h-[250px]"
                                      disabled={!canInteract}
                                    />
                                  )}
                              </FormControl>
                               <div className="flex items-center justify-between mt-2">
                                {activePack ? (
                                  <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                    <Package className="h-3 w-3" />
                                    Using: {activePack.name}
                                  </Badge>
                                ) : <div />}
                                <div className="flex items-center gap-4">
                                     <Button type="button" variant="link" size="sm" onClick={() => setIsTagModalOpen(true)} className="px-1">
                                        <Tags className="mr-2 h-3 w-3"/> Tag Assistant
                                     </Button>
                                     <div className="flex items-center space-x-2">
                                        <Label htmlFor="prompt-mode" className="text-xs text-muted-foreground flex items-center gap-1.5"><CaseSensitive/> Text Mode</Label>
                                        <Switch
                                            id="prompt-mode"
                                            checked={promptMode === 'text'}
                                            onCheckedChange={(checked) => setPromptMode(checked ? 'text' : 'tags')}
                                        />
                                    </div>
                                </div>
                               </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </TabsContent>
                    <TabsContent value="settings" className="space-y-6 pt-4">
                       <FormField
                          control={generationForm.control}
                          name="aspectRatio"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Aspect Ratio</FormLabel>
                               <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-3 gap-2"
                                    disabled={!canInteract}
                                  >
                                    <FormItem><FormControl><RadioGroupItem value="1:1" id="square" className="sr-only" /></FormControl><FormLabel htmlFor="square" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === '1:1' && "border-primary")}><Square className="mb-2 h-5 w-5" /><span className="text-xs">Square</span></FormLabel></FormItem>
                                     <FormItem><FormControl><RadioGroupItem value="16:9" id="landscape" className="sr-only" /></FormControl><FormLabel htmlFor="landscape" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === '16:9' && "border-primary")}><RectangleHorizontal className="mb-2 h-5 w-5" /><span className="text-xs">Landscape</span></FormLabel></FormItem>
                                     <FormItem><FormControl><RadioGroupItem value="9:16" id="portrait" className="sr-only" /></FormControl><FormLabel htmlFor="portrait" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === '9:16' && "border-primary")}><RectangleVertical className="mb-2 h-5 w-5" /><span className="text-xs">Portrait</span></FormLabel></FormItem>
                                  </RadioGroup>
                               </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={generationForm.control}
                          name="rarity"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Rarity</FormLabel>
                               <FormControl>
                                  <RadioGroup
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={String(field.value)}
                                    className="grid grid-cols-5 gap-2"
                                    disabled={!canInteract}
                                  >
                                    {[1, 2, 3, 4, 5].map(rarity => (
                                         <FormItem key={rarity}>
                                            <FormControl><RadioGroupItem value={String(rarity)} id={`rarity-${rarity}`} className="sr-only" /></FormControl>
                                            <FormLabel htmlFor={`rarity-${rarity}`} className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === rarity && "border-primary")}>
                                                <div className="flex">
                                                    {Array.from({length: rarity}).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                                                </div>
                                            </FormLabel>
                                        </FormItem>
                                    ))}
                                  </RadioGroup>
                               </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />


                        <Accordion type="single" collapsible defaultValue="engine">
                            <AccordionItem value="engine">
                                <AccordionTrigger>AI Settings</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                     <VisualModelSelector
                                        label="Text Model (LLM)"
                                        model={selectedTextModel}
                                        onOpen={() => handleOpenModelModal('text')}
                                        disabled={!canInteract}
                                        isLoading={false}
                                    />
                                    <VisualModelSelector
                                        label="Image Model"
                                        model={selectedModel}
                                        onOpen={() => handleOpenModelModal('model')}
                                        disabled={!canInteract}
                                        isLoading={isLoadingModels}
                                    />
                                    <VisualModelSelector
                                        label="LoRA (Optional)"
                                        model={selectedLora}
                                        onOpen={() => handleOpenModelModal('lora')}
                                        disabled={!canInteract || !loraCompatible || availableLoras.length === 0}
                                        isLoading={isLoadingModels}
                                    />
                                    {selectedLora && loraCompatible && (
                                        <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                                             <Controller
                                                control={generationForm.control}
                                                name="loraWeight"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex justify-between"><FormLabel>LoRA Weight</FormLabel><span className="text-sm font-medium">{field.value?.toFixed(2)}</span></div>
                                                        <FormControl><Slider defaultValue={[field.value || 0.75]} max={2} step={0.05} onValueChange={(value) => field.onChange(value[0])} disabled={!canInteract}/></FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>
                </Tabs>
                <div className="pt-4">
                    <Button type="submit" size="lg" className="w-full font-headline text-lg" disabled={!canInteract}>
                        {isGenerating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Forging Details...</>) : (<><Wand2 className="mr-2 h-4 w-4" /> Forge Character</>)}
                    </Button>
                </div>
                {!authUser && !authLoading && <p className="text-xs text-center text-muted-foreground">You must be logged in to forge a character.</p>}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="min-h-full shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">2. Generated Character</CardTitle>
            <CardDescription>
              Review the generated character. Once you're happy, generate the portrait and save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && !generationResult && (
               <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                    <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
                    <p className="text-lg font-medium font-headline tracking-wider">Forging your character...</p>
                    <p className="text-sm">This may take a moment. The AI is hard at work.</p>
              </div>
            )}

            {!isGenerating && !generationResult && (
               <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                {generationError ? (
                   <Alert variant="destructive" className="text-left w-full max-w-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation Error</AlertTitle>
                      <AlertDescription>
                         <p className="mb-4">{generationError}</p>
                      </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg font-medium font-headline tracking-wider">Your character's story awaits</p>
                    <p className="text-sm">Fill out the form to begin the creation process.</p>
                  </>
                )}
              </div>
            )}
            {generationResult && (
               <div className="grid gap-8 md:grid-cols-5">
                  <div className="md:col-span-2 space-y-4">
                     <h3 className="font-headline text-2xl flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-primary" /> Portrait</h3>
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg bg-muted/20 p-1">
                          {isGenerating && !generationResult.imageUrl && (
                              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  <p className="mt-2 text-sm">Generating portrait...</p>
                              </div>
                          )}
                          {generationResult.imageUrl ? (
                             <>
                                <Image
                                  src={generationResult.imageUrl}
                                  alt="Generated character portrait"
                                  fill
                                  className="object-contain"
                                  sizes="100vw"
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-green-600 text-white text-xs font-bold py-1 px-2 rounded-full shadow">
                                  <Check className="w-3 h-3"/>
                                  Ready to Save
                               </div>
                             </>
                          ) : (
                            !isGenerating && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 gap-4">
                                     <div className="w-full space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="physicalDescription" className="flex items-center gap-1.5 text-xs"><Info className="h-3 w-3"/> Image Prompt</Label>
                                        </div>
                                        <Textarea 
                                            id="physicalDescription"
                                            value={watchPhysicalDescription || ''}
                                            onChange={(e) => generationForm.setValue('physicalDescription', e.target.value)}
                                            className="h-32 text-xs" 
                                        />
                                     </div>
                                    <Button onClick={onGeneratePortrait} disabled={isGenerating}>
                                         <Wand2 className="mr-2" /> Generate Portrait
                                    </Button>
                                </div>
                            )
                          )}
                      </div>
                  </div>

                  <div className="md:col-span-3">
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                <User className="h-6 w-6 text-primary shrink-0"/>
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground">Name</h4>
                                    <p className="text-lg font-bold">{generationResult.name}</p>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <Shield className="h-6 w-6 text-primary shrink-0"/>
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground">Archetype</h4>
                                    <p className="text-lg font-bold">{generationResult.archetype}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><Swords className="h-4 w-4 text-primary"/> Equipment</h4>
                                <ul className="list-disc list-inside text-card-foreground space-y-1 text-sm">
                                    {generationResult.equipment?.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><FileText className="h-4 w-4 text-primary"/> Biography</h4>
                                 <ScrollArea className="h-48 pr-4 border rounded-md p-3 bg-muted/20">
                                    <p className="text-sm whitespace-pre-wrap">{generationResult.biography}</p>
                                </ScrollArea>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button onClick={onSave} className="w-full" disabled={!canInteract || isSaving || !generationResult.imageUrl}>
                              {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                              ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save to Gallery</>
                              )}
                            </Button>
                        </div>
                  </div>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

    