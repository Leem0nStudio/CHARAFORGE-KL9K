
"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText, Save, AlertCircle, Image as ImageIcon, Check, Package, Square, RectangleHorizontal, RectangleVertical, Tags, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { saveCharacter } from "@/app/actions/characters";
import { generateCharacter, type GenerateCharacterInput } from "@/app/actions/generation";
import { getInstalledDataPacks } from "@/app/actions/datapacks";
import { getModels } from "@/app/actions/ai-models";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { DataPackSelectorModal } from "./datapack-selector-modal";
import { Badge } from "./ui/badge";
import type { DataPack } from "@/types/datapack";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { TagAssistantModal } from "./tag-assistant-modal";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";
import { ModelSelectorModal } from './model-selector-modal';
import type { AiModel } from '@/types/ai-model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MediaDisplay } from "./media-display";


const generationFormSchema = z.object({
  description: z.string().min(20, {
    message: "Please enter a more detailed description (at least 20 characters).",
  }).max(1000, {
    message: "Description must not be longer than 1000 characters."
  }),
  tags: z.string().optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  imageEngine: z.enum(['huggingface', 'gemini']).default('huggingface'),
  hfModelId: z.string().optional(),
  lora: z.string().optional(),
  loraWeight: z.number().min(0).max(1).optional(),
  triggerWords: z.string().optional(),
});

const saveFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(50, {
    message: "Name must not be longer than 50 characters."
  }),
});

type GenerationResult = {
  biography: string;
  imageUrl: string;
  description: string;
  tags: string;
  dataPackId?: string | null;
};

// Sub-component for the visual model selector button
function VisualModelSelector({ label, model, onOpen, disabled, isLoading }: { label: string, model?: AiModel | null, onOpen: () => void, disabled: boolean, isLoading?: boolean }) {
    
    if (isLoading) {
        return (
             <div>
                <Label>{label}</Label>
                <div className="h-auto w-full justify-start p-2 mt-1 flex items-center">
                    <Skeleton className="w-16 h-16 rounded-md shrink-0 mr-4" />
                    <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div>
            <Label>{label}</Label>
            <Button type="button" variant="outline" className="h-auto w-full justify-start p-2 mt-1" onClick={onOpen} disabled={disabled}>
                 <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted/20 mr-4">
                    {model?.coverMediaUrl ? (
                        <MediaDisplay url={model.coverMediaUrl} type={model.coverMediaType} alt={model.name} className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><Settings /></div>
                    )}
                </div>
                <div className="text-left">
                    <p className="font-semibold text-card-foreground">{model?.name || 'Select...'}</p>
                    <p className="text-xs text-muted-foreground truncate">{model?.hf_id || 'Click to choose a model'}</p>
                </div>
            </Button>
        </div>
    )
}

export function CharacterGenerator() {
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelModalType, setModelModalType] = useState<'model' | 'lora'>('model');

  const [installedPacks, setInstalledPacks] = useState<DataPack[]>([]);
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [availableLoras, setAvailableLoras] = useState<AiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activePackName, setActivePackName] = useState<string | null>(null);
  
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [selectedLora, setSelectedLora] = useState<AiModel | null>(null);

  const { toast } = useToast();
  const { authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataPackIdFromUrl = searchParams.get('packId');

  const generationForm = useForm<z.infer<typeof generationFormSchema>>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      description: "",
      tags: "",
      targetLanguage: 'English',
      aspectRatio: '1:1',
      imageEngine: 'huggingface',
      hfModelId: "",
      lora: "",
      loraWeight: 0.75,
      triggerWords: "",
    },
  });

  const saveForm = useForm<z.infer<typeof saveFormSchema>>({
    resolver: zodResolver(saveFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const handlePromptGenerated = useCallback((prompt: string, packName: string, tags: string[], packId: string) => {
    generationForm.setValue('description', prompt, { shouldValidate: true });
    generationForm.setValue('tags', tags.join(','));
    setActivePackName(packName);
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('packId', packId);
    currentUrl.searchParams.set('prompt', encodeURIComponent(prompt));
    router.replace(currentUrl.toString(), { scroll: false });
    setIsPackModalOpen(false);
  }, [generationForm, router]);
  
  
  useEffect(() => {
    async function loadInitialData() {
        if (!authUser) return;
        setIsLoading(true);
        try {
            const [packs, models, loras] = await Promise.all([
                getInstalledDataPacks(),
                getModels('model'),
                getModels('lora'),
            ]);
            setInstalledPacks(packs);
            setAvailableModels(models);
            setAvailableLoras(loras);

            if (models.length > 0) {
                setSelectedModel(models[0]);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load required data.' });
            console.error("Failed to load initial data:", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadInitialData();
  }, [authUser, toast]);
  

  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl) {
      generationForm.setValue('description', decodeURIComponent(promptFromUrl));
    }
  }, [searchParams, generationForm]);

  useEffect(() => {
    if (dataPackIdFromUrl && installedPacks.length > 0) {
        const activePack = installedPacks.find(p => p.id === dataPackIdFromUrl);
        if (activePack) {
            setActivePackName(activePack.name);
        }
    }
  }, [dataPackIdFromUrl, installedPacks]);


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

  const onGenerate = useCallback(async (data: GenerateCharacterInput) => {
    if (!authUser) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to generate a character.",
      });
      return;
    }
    
    setGenerationResult(null);
    setGenerationError(null);
    saveForm.reset();

    startGenerationTransition(async () => {
      const result = await generateCharacter({ ...data, dataPackId: dataPackIdFromUrl });
      
      if (result.success && result.data) {
        setGenerationResult(result.data);
        toast({ title: "Generation Complete!", description: "Your character is ready." });
      } else {
        const errorMessage = result.error || "An unknown error occurred during generation.";
        setGenerationError(errorMessage);
        toast({ variant: "destructive", title: "Generation Failed", description: errorMessage });
      }
    });
  }, [authUser, toast, dataPackIdFromUrl, saveForm]);

  async function onSave(data: z.infer<typeof saveFormSchema>) {
    if (!generationResult || !generationResult.imageUrl || !authUser) {
         toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Character data is incomplete, image not generated, or you are not logged in.",
        });
        return;
    }

    startSavingTransition(async () => {
      try {
        const result = await saveCharacter({
          name: data.name,
          description: generationResult.description,
          biography: generationResult.biography,
          imageUrl: generationResult.imageUrl,
          dataPackId: generationResult.dataPackId,
          tags: generationResult.tags,
        });

        toast({
          title: "Character Saved!",
          description: `${data.name} has been saved to your gallery.`,
        });
        
        router.push(`/characters/${result.characterId}`);

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
  
  const handleOpenModelModal = (type: 'model' | 'lora') => {
      setModelModalType(type);
      setIsModelModalOpen(true);
  }

  const handleModelSelect = (model: AiModel) => {
    if (model.type === 'model') {
        setSelectedModel(model);
    } else {
        setSelectedLora(model);
        const defaultVersion = model.versions?.[0];
        if (defaultVersion) {
            generationForm.setValue('lora', defaultVersion.id);
            generationForm.setValue('triggerWords', defaultVersion.triggerWords?.join(', ') || '');
        } else {
            generationForm.setValue('lora', model.versionId);
            generationForm.setValue('triggerWords', model.triggerWords?.join(', ') || '');
        }
    }
    setIsModelModalOpen(false);
  }

  const handleVersionChange = (versionId: string) => {
      if (!selectedLora) return;

      const selectedVersion = selectedLora.versions?.find(v => v.id === versionId);
      if (selectedVersion) {
          generationForm.setValue('lora', selectedVersion.id);
          generationForm.setValue('triggerWords', selectedVersion.triggerWords?.join(', ') || '');
      }
  }

  const isUiLoading = isGenerating || isSaving || authLoading || isLoading;
  const canInteract = !isUiLoading && !!authUser;
  const watchDescription = generationForm.watch('description');

  const handleForgeClick = () => {
    if (!selectedModel) {
        toast({ variant: 'destructive', title: 'Model Required', description: 'Please select a base model before generating.' });
        return;
    }
    const formData = generationForm.getValues();
    const finalData = {
      ...formData,
      hfModelId: selectedModel?.hf_id,
    }
    onGenerate(finalData);
  };

  return (
    <>
    <DataPackSelectorModal 
      isOpen={isPackModalOpen}
      onClose={() => setIsPackModalOpen(false)}
      onPromptGenerated={handlePromptGenerated}
      installedPacks={installedPacks}
      isLoading={isLoading}
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
        models={modelModalType === 'model' ? availableModels : availableLoras}
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
              <form onSubmit={(e) => { e.preventDefault(); handleForgeClick(); }} className="space-y-6">
                
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
                                <FormLabel>Character Description</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsPackModalOpen(true)}>
                                    <Package className="mr-2 h-3 w-3"/> Use DataPack
                                </Button>
                              </div>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., A grizzled space pirate with a cybernetic eye, a long trench coat, and a sarcastic parrot on their shoulder..."
                                  className="min-h-[250px] resize-none"
                                  {...field}
                                  disabled={!canInteract}
                                />
                              </FormControl>
                               <div className="flex items-center justify-between mt-2">
                                {activePackName && (
                                  <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                    <Package className="h-3 w-3" />
                                    Using: {activePackName}
                                  </Badge>
                                )}
                                 <Button type="button" variant="link" size="sm" onClick={() => setIsTagModalOpen(true)} className="ml-auto">
                                    <Tags className="mr-2 h-3 w-3"/> Tag Assistant
                                 </Button>
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

                        <Accordion type="single" collapsible defaultValue="engine">
                            <AccordionItem value="engine">
                                <AccordionTrigger>AI Engine</AccordionTrigger>
                                <AccordionContent>
                                     <FormField
                                      control={generationForm.control}
                                      name="imageEngine"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                           <FormControl>
                                              <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="grid grid-cols-2 gap-4"
                                                disabled={!canInteract}
                                              >
                                                <FormItem>
                                                  <FormControl><RadioGroupItem value="huggingface" id="huggingface" className="sr-only" /></FormControl>
                                                  <FormLabel htmlFor="huggingface" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-full", field.value === 'huggingface' && "border-primary")}>
                                                    <span className="font-bold">Stable Diffusion</span>
                                                    <span className="text-xs text-muted-foreground">via Hugging Face</span>
                                                  </FormLabel>
                                                </FormItem>
                                                 <FormItem>
                                                  <FormControl><RadioGroupItem value="gemini" id="gemini" className="sr-only" /></FormControl>
                                                  <FormLabel htmlFor="gemini" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-full", field.value === 'gemini' && "border-primary")}>
                                                   <span className="font-bold">Gemini Image</span>
                                                    <span className="text-xs text-muted-foreground">Google Model</span>
                                                  </FormLabel>
                                                </FormItem>
                                              </RadioGroup>
                                           </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    {generationForm.watch('imageEngine') === 'huggingface' && (
                                        <div className="space-y-4 mt-4 rounded-md border p-4 bg-muted/20">
                                            <VisualModelSelector
                                                label="Base Model"
                                                model={selectedModel}
                                                onOpen={() => handleOpenModelModal('model')}
                                                disabled={!canInteract}
                                                isLoading={isLoading}
                                            />
                                             <VisualModelSelector
                                                label="LoRA (Optional)"
                                                model={selectedLora}
                                                onOpen={() => handleOpenModelModal('lora')}
                                                disabled={!canInteract}
                                                isLoading={isLoading}
                                            />
                                            {selectedLora && (
                                                <div className="space-y-2">
                                                    {selectedLora.versions && selectedLora.versions.length > 1 && (
                                                        <Controller
                                                            control={generationForm.control}
                                                            name="lora"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Version</FormLabel>
                                                                    <Select onValueChange={(value) => { field.onChange(value); handleVersionChange(value); }} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select a version" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {selectedLora.versions?.map(v => (
                                                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                     <Controller
                                                        control={generationForm.control}
                                                        name="loraWeight"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <div className="flex justify-between"><FormLabel>LoRA Weight</FormLabel><span className="text-sm font-medium">{field.value?.toFixed(2)}</span></div>
                                                                <FormControl><Slider defaultValue={[field.value || 0.75]} max={1} step={0.05} onValueChange={(value) => field.onChange(value[0])} disabled={!canInteract}/></FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                          </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </TabsContent>
                </Tabs>
                <div className="pt-4">
                    <Button type="button" size="lg" className="w-full font-headline text-lg" onClick={handleForgeClick} disabled={!canInteract}>
                        {isGenerating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Forging...</>) : (<><Wand2 className="mr-2 h-4 w-4" /> Forge Character</>)}
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
              Review the generated character. Once you're happy, give it a name and save it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && (
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
                      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 shadow-lg bg-muted/20 p-1">
                          <Image
                              src={generationResult.imageUrl}
                              alt="Generated character portrait"
                              fill
                              className="object-contain"
                              sizes="100vw"
                          />
                           <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-green-600 text-white text-xs font-bold py-1 px-2 rounded-full shadow">
                              <Check className="w-3 h-3"/>
                              Ready
                          </div>
                      </div>
                  </div>

                  <div className="md:col-span-3">
                      <h3 className="font-headline text-2xl flex items-center mb-2"><FileText className="w-5 h-5 mr-2 text-primary" /> Biography</h3>
                      <ScrollArea className="h-80 pr-4 mb-6">
                        <div className="space-y-4 text-muted-foreground text-sm">
                            {generationResult.biography.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                      </ScrollArea>

                      <Form {...saveForm}>
                        <form onSubmit={saveForm.handleSubmit(onSave)} className="space-y-4">
                           <FormField
                              control={saveForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-headline text-2xl flex items-center"><Save className="w-5 h-5 mr-2 text-primary"/> Character Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Captain Kaelen" {...field} disabled={!canInteract} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={!canInteract || isSaving}>
                              {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                              ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save to Gallery</>
                              )}
                            </Button>
                        </form>
                      </Form>
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
