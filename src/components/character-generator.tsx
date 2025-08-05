
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText, Save, AlertCircle, Image as ImageIcon, Check, Sparkles } from "lucide-react";

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
import { generateCharacterBio } from "@/ai/flows/generate-character-bio";
import { generateCharacterImage } from "@/ai/flows/generate-character-image";
import { resizeImage } from "@/ai/flows/resize-image";
import { saveCharacter } from "@/ai/flows/save-character";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const generationFormSchema = z.object({
  description: z.string().min(20, {
    message: "Please enter a more detailed description (at least 20 characters).",
  }).max(1000, {
    message: "Description must not be longer than 1000 characters."
  }),
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
};

export function CharacterGenerator() {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { toast } = useToast();
  const { authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const generationForm = useForm<z.infer<typeof generationFormSchema>>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      description: "",
    },
  });

  const saveForm = useForm<z.infer<typeof saveFormSchema>>({
    resolver: zodResolver(saveFormSchema),
    defaultValues: {
      name: "",
    },
  });

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
      const bioResult = await generateCharacterBio({ description: data.description });
      if (!bioResult.biography) {
        throw new Error("AI failed to generate a biography.");
      }
      setCharacterData({
        biography: bioResult.biography,
        imageUrl: null,
        description: data.description,
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
        const imageResult = await generateCharacterImage({ description: characterData.description });
        if (!imageResult.imageUrl) {
            throw new Error("AI model did not return an image. This could be due to safety filters or an API issue.");
        }
        setCharacterData(prev => prev ? {...prev, imageUrl: imageResult.imageUrl} : null);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during image generation.";
        setImageError(errorMessage);
        toast({
            variant: "destructive",
            title: "Image Generation Failed",
            description: errorMessage,
        });
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
      // Step 1: Resize the image in the background.
      const { resizedImageUrl } = await resizeImage({ imageUrl: characterData.imageUrl });
      if (!resizedImageUrl) {
        throw new Error("Failed to optimize the image for saving.");
      }

      // Step 2: Get the user's ID token for the save operation.
      const idToken = await authUser.getIdToken(true);

      // Step 3: Save the character with the resized image.
      await saveCharacter({
        name: data.name,
        description: characterData.description,
        biography: characterData.biography,
        imageUrl: resizedImageUrl,
        idToken: idToken,
      });

      // Step 4: Provide success feedback and redirect.
      toast({
        title: "Character Saved!",
        description: `${data.name} has been saved to your gallery.`,
      });
      
      router.push('/characters');

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
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="sticky top-20 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">1. Character Details</CardTitle>
            <CardDescription>
              Provide a description, and our AI will craft a unique biography for your character.
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
                      <FormLabel>Character Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A grizzled space pirate with a cybernetic eye, a long trench coat, and a sarcastic parrot on their shoulder. They are haunted by a past betrayal..."
                          className="min-h-[150px] resize-none"
                          {...field}
                          disabled={!canInteract}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full font-headline text-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-transform hover:scale-105" disabled={!canInteract}>
                  {isGeneratingBio ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Forging Biography...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Forge Biography
                    </>
                  )}
                </Button>
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
                        <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-green-500 shadow-lg">
                            <Image
                                src={characterData.imageUrl}
                                alt="Generated character portrait"
                                fill
                                className="object-cover"
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
                                        <p>{imageError}</p>
                                    </AlerDescription>
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
  );
}

    