
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText, Save, AlertCircle, Image as ImageIcon, Check, Package, Square, RectangleHorizontal, RectangleVertical, Tags } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateCharacterBio } from "@/ai/flows/character-bio/flow";
import { generateCharacterImage } from "@/ai/flows/character-image/flow";
import { saveCharacter } from "@/app/actions/characters";
import { getInstalledDataPacks } from "@/app/actions/datapacks";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { DataPackSelectorModal } from "./datapack-selector-modal";
import { Badge } from "./ui/badge";
import type { DataPack } from "@/types/datapack";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { TagAssistantModal } from "./tag-assistant-modal";

const generationFormSchema = z.object({
  description: z.string().min(20, {
    message: "Please enter a more detailed description (at least 20 characters).",
  }).max(1000, {
    message: "Description must not be longer than 1000 characters."
  }),
  tags: z.string().optional(), // Hidden field for tags
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  engine: z.enum(['gradio', 'gemini']).default('gradio'),
});

const saveFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(50, {
    message: "Name must not be longer than 50 characters."
  }),
});

type CharacterData = {
  biography: string;
  imageUrl: string | null;
  description: string;
  tags: string;
  dataPackId?: string | null;
  aspectRatio: '1:1' | '16:9' | '9:16';
  engine: 'gradio' | 'gemini';
};

export function CharacterGenerator() {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [installedPacks, setInstalledPacks] = useState<DataPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(false);
  const [activePackName, setActivePackName] = useState<string | null>(null);

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
      engine: 'gradio',
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
  
  // Effect to read prompt from URL and set it in the form
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    if (promptFromUrl) {
      generationForm.setValue('description', decodeURIComponent(promptFromUrl));
    }
  }, [searchParams, generationForm]);

  // Effect to load installed packs for the modal and find the active pack name
  useEffect(() => {
    async function loadPacksAndSetActive() {
        if (dataPackIdFromUrl) {
            try {
                const packs = await getInstalledDataPacks();
                setInstalledPacks(packs);
                const activePack = packs.find(p => p.id === dataPackIdFromUrl);
                if (activePack) {
                    setActivePackName(activePack.name);
                }
            } catch (error) {
                 console.error("Failed to fetch pack name:", error);
            }
        }
    }
    loadPacksAndSetActive();
  }, [dataPackIdFromUrl]);

  const handleOpenPackModal = async () => {
    setIsLoadingPacks(true);
    setIsPackModalOpen(true);
    try {
      if (installedPacks.length === 0) {
        const packs = await getInstalledDataPacks();
        setInstalledPacks(packs);
      }
    } catch(err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load your DataPacks.' });
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const handleAppendTags = (tags: string[]) => {
    const currentDesc = generationForm.getValues('description');
    const currentTags = generationForm.getValues('tags') || '';
    
    // Avoid adding duplicate tags to the description
    const newTags = tags.filter(t => !currentDesc.includes(t));
    if (newTags.length > 0) {
        generationForm.setValue('description', `${currentDesc}, ${newTags.join(', ')}`.trim());
    }
    
    // Add all tags to the hidden tags field for metadata
    const allTags = new Set([...currentTags.split(',').filter(Boolean), ...tags]);
    generationForm.setValue('tags', Array.from(allTags).join(','));
  };

  async function onGenerateBio(data: z.infer<typeof generationFormSchema>) {
    if (!authUser) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to generate a character.",
      });
      return;
    }
    
    setIsGeneratingBio(true);
    setCharacterData(null);
    setBioError(null);
    setImageError(null);
    saveForm.reset();

    try {
      const bioResult = await generateCharacterBio({ description: data.description, targetLanguage: data.targetLanguage });
      if (!bioResult.biography) {
        throw new Error("AI failed to generate a biography.");
      }
      setCharacterData({
        biography: bioResult.biography,
        imageUrl: null,
        description: data.description,
        tags: data.tags || '',
        dataPackId: dataPackIdFromUrl,
        aspectRatio: data.aspectRatio,
        engine: data.engine,
      });
    } catch (err: unknown) {
       const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during biography generation.";
       setBioError(errorMessage);
       toast({
        variant: "destructive",
        title: "Biography Failed",
        description: errorMessage,
      });
    } finally {
      setIsGeneratingBio(false);
    }
  }

  async function onGenerateImage() {
    if (!characterData) return;

    setIsGeneratingImage(true);
    setImageError(null);
    try {
        const imageResult = await generateCharacterImage({ 
            description: characterData.description,
            aspectRatio: characterData.aspectRatio,
            engine: characterData.engine,
        });
        if (!imageResult.imageUrl) {
            throw new Error("AI model did not return an image. This could be due to safety filters or an API issue.");
        }
        setCharacterData(prev => prev ? {...prev, imageUrl: imageResult.imageUrl} : null);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during image generation.";
        setImageError(errorMessage);
        if (!errorMessage.includes('Gradio')) {
            toast({
                variant: "destructive",
                title: "Image Generation Failed",
                description: errorMessage,
            });
        }
    } finally {
        setIsGeneratingImage(false);
    }
  }

  async function onSave(data: z.infer<typeof saveFormSchema>) {
    if (!characterData || !characterData.imageUrl || !authUser) {
         toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Character data is incomplete, image not generated, or you are not logged in.",
        });
        return;
    }

    setIsSaving(true);
    try {
      const result = await saveCharacter({
        name: data.name,
        description: characterData.description,
        biography: characterData.biography,
        imageUrl: characterData.imageUrl,
        dataPackId: characterData.dataPackId,
        tags: characterData.tags,
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
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = isGeneratingBio || isSaving || authLoading;
  const canInteract = !isLoading && authUser;
  const isImageReadyForSave = !!characterData?.imageUrl;

  return (
    <>
    <DataPackSelectorModal 
      isOpen={isPackModalOpen}
      onClose={() => setIsPackModalOpen(false)}
      onPromptGenerated={handlePromptGenerated}
      installedPacks={installedPacks}
      isLoading={isLoadingPacks}
    />
    <TagAssistantModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onAppendTags={handleAppendTags}
    />
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="sticky top-20 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">1. Character Details</CardTitle>
            <CardDescription>
              Provide a description, or select a DataPack to build one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...generationForm}>
              <form onSubmit={generationForm.handleSubmit(onGenerateBio)} className="space-y-6">
                <FormField
                  control={generationForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Character Description</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsTagModalOpen(true)}>
                            <Tags className="mr-2 h-3 w-3"/> Tag Assistant
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A grizzled space pirate with a cybernetic eye, a long trench coat, and a sarcastic parrot on their shoulder. They are haunted by a past betrayal..."
                          className="min-h-[150px] resize-none"
                          {...field}
                          disabled={!canInteract}
                        />
                      </FormControl>
                      {activePackName && (
                          <Badge variant="secondary" className="flex items-center gap-1.5 mt-2 w-fit">
                            <Package className="h-3 w-3" />
                            Using: {activePackName}
                          </Badge>
                        )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={generationForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="1:1" id="square" className="sr-only" />
                              </FormControl>
                              <FormLabel 
                                htmlFor="square"
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center",
                                  field.value === '1:1' && "border-primary"
                                )}
                              >
                                <Square className="mb-2 h-5 w-5" />
                                <span className="text-xs">Square</span>
                              </FormLabel>
                            </FormItem>
                             <FormItem>
                              <FormControl>
                                <RadioGroupItem value="16:9" id="landscape" className="sr-only" />
                              </FormControl>
                              <FormLabel 
                                htmlFor="landscape"
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center",
                                  field.value === '16:9' && "border-primary"
                                )}
                              >
                                <RectangleHorizontal className="mb-2 h-5 w-5" />
                                <span className="text-xs">Landscape</span>
                              </FormLabel>
                            </FormItem>
                             <FormItem>
                              <FormControl>
                                <RadioGroupItem value="9:16" id="portrait" className="sr-only" />
                              </FormControl>
                              <FormLabel 
                                htmlFor="portrait"
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center",
                                  field.value === '9:16' && "border-primary"
                                )}
                              >
                                <RectangleVertical className="mb-2 h-5 w-5" />
                                <span className="text-xs">Portrait</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={generationForm.control}
                  name="engine"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>AI Engine</FormLabel>
                       <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-2"
                            disabled={!canInteract}
                          >
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="gradio" id="gradio" className="sr-only" />
                              </FormControl>
                              <FormLabel 
                                htmlFor="gradio"
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center h-full",
                                  field.value === 'gradio' && "border-primary"
                                )}
                              >
                                <span className="text-xs font-bold">Stable Diffusion</span>
                                <span className="text-xs text-muted-foreground">via Gradio</span>
                              </FormLabel>
                            </FormItem>
                             <FormItem>
                              <FormControl>
                                <RadioGroupItem value="gemini" id="gemini" className="sr-only" />
                              </FormControl>
                              <FormLabel 
                                htmlFor="gemini"
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center h-full",
                                  field.value === 'gemini' && "border-primary"
                                )}
                              >
                               <span className="text-xs font-bold">Gemini Image</span>
                                <span className="text-xs text-muted-foreground">via Google</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                 <FormField
                  control={generationForm.control}
                  name="targetLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Output Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canInteract}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" size="lg" className="w-full font-headline text-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-transform hover:scale-105" disabled={!canInteract}>
                      {isGeneratingBio ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Forging...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Forge Bio
                        </>
                      )}
                    </Button>
                    <Button type="button" size="lg" className="w-full" variant="secondary" onClick={handleOpenPackModal} disabled={!canInteract}>
                      <Package className="mr-2" />
                      Use DataPack
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
              Review the biography, then generate a portrait. Save your creation once complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGeneratingBio && (
              <div className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
              </div>
            )}
            {!isGeneratingBio && !characterData && (
               <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                {bioError ? (
                   <Alert variant="destructive" className="text-left w-full max-w-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation Error</AlertTitle>
                      <AlertDescription>
                         <p className="mb-4">{bioError}</p>
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
            {characterData && (
               <div className="grid gap-8 md:grid-cols-5">
                  <div className="md:col-span-2 space-y-4">
                     <h3 className="font-headline text-2xl flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-primary" /> Portrait</h3>
                     {isGeneratingImage && <Skeleton className="w-full aspect-square rounded-lg" />}
                     
                     {!isGeneratingImage && characterData.imageUrl && (
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-500 shadow-lg bg-muted/20 p-1">
                            <Image
                                src={characterData.imageUrl}
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
                     )}

                     {!characterData.imageUrl && !isGeneratingImage && (
                        <div className="flex flex-col items-center justify-center text-center p-4 min-h-[200px] border-2 border-dashed rounded-lg bg-card/50">
                             {imageError ? (
                                <Alert variant="destructive" className="text-left w-full text-xs">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Image Error</AlertTitle>
                                    <AlertDescription>
                                        <p className="mb-2">{imageError}</p>
                                        {imageError.includes('Gradio') && (
                                            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => generationForm.setValue('engine', 'gemini')}>
                                                Switch to Gemini Engine
                                            </Button>
                                        )}
                                    </AlertDescription>
                                </Alert>
                             ) : (
                                <p className="text-sm text-muted-foreground">Biography generated. Ready for a portrait.</p>
                             )}
                            <Button onClick={onGenerateImage} className="mt-4 w-full" disabled={isGeneratingImage}>
                                {isGeneratingImage ? <Loader2 className="animate-spin" /> : "Generate Portrait"}
                            </Button>
                        </div>
                     )}
                  </div>

                  <div className="md:col-span-3">
                      <h3 className="font-headline text-2xl flex items-center mb-4"><FileText className="w-5 h-5 mr-2 text-primary" /> Biography</h3>
                      <div className="space-y-4 text-muted-foreground mb-6 text-sm max-h-80 overflow-y-auto pr-2">
                        {characterData.biography.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      <Form {...saveForm}>
                        <form onSubmit={saveForm.handleSubmit(onSave)} className="space-y-4">
                           <FormField
                              control={saveForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>3. Character Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Captain Kaelen" {...field} disabled={!canInteract || !isImageReadyForSave} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={!canInteract || isSaving || !isImageReadyForSave}>
                              {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                              ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save to Gallery</>
                              )}
                            </Button>
                            {isGeneratingImage && (
                               <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> 
                                Generating Portrait...
                               </p>
                            )}
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
