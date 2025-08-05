
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText, Save, AlertCircle } from "lucide-react";

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
  imageUrl: string;
  description: string;
};

export function CharacterGenerator() {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
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

  async function onGenerate(data: z.infer<typeof generationFormSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to generate a character.",
      });
      return;
    }
    setIsGenerating(true);
    setCharacterData(null);
    setError(null);

    try {
      const [bioResult, imageResult] = await Promise.all([
        generateCharacterBio({ description: data.description }),
        generateCharacterImage({ description: data.description }),
      ]);

      if (!bioResult.biography || !imageResult.imageUrl) {
        throw new Error("AI generation failed. One or both outputs were empty.");
      }

      setCharacterData({
        biography: bioResult.biography,
        imageUrl: imageResult.imageUrl,
        description: data.description,
      });

    } catch (err: unknown) {
       const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during generation.";
       setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSave(data: z.infer<typeof saveFormSchema>) {
    if (!characterData || !user) return;

    setIsSaving(true);
    try {
      const result = await saveCharacter({
        name: data.name,
        description: characterData.description,
        biography: characterData.biography,
        imageUrl: characterData.imageUrl,
      });

      toast({
        title: "Character Saved!",
        description: `${data.name} has been saved to your gallery.`,
      });
      
      if (result.success) {
        router.push('/characters');
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Could not save your character. Please try again.";
      if (errorMessage.includes("User session")) {
            toast({
                variant: "destructive",
                title: "Session Expired",
                description: "Your session might have expired. Please log out and log back in.",
            });
       } else {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: errorMessage,
            });
       }
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = isGenerating || isSaving;
  const canInteract = !isLoading && !authLoading && user;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="sticky top-20 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Character Details</CardTitle>
            <CardDescription>
              Provide a description, and our AI will craft a unique biography and portrait for your character.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...generationForm}>
              <form onSubmit={generationForm.handleSubmit(onGenerate)} className="space-y-6">
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
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Forging...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Forge Character
                    </>
                  )}
                </Button>
                {!user && !authLoading && <p className="text-xs text-center text-muted-foreground">You must be logged in to forge a character.</p>}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="min-h-full shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Generated Character</CardTitle>
            <CardDescription>
              The result of your creative spark and our AI's magic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && (
              <div className="grid gap-8 md:grid-cols-5">
                <Skeleton className="md:col-span-2 w-full aspect-square rounded-lg" />
                <div className="md:col-span-3 space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-6 w-full mt-2" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
              </div>
            )}
            {!isGenerating && !characterData && (
               <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                {error ? (
                   <Alert variant="destructive" className="text-left w-full max-w-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation Error</AlertTitle>
                      <AlertDescription>
                         <p className="mb-4">{error}</p>
                         <Button 
                            onClick={() => onGenerate(generationForm.getValues())} 
                            className="w-full"
                            disabled={!canInteract}
                          >
                            {isGenerating ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Try Again
                         </Button>
                      </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Wand2 className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg font-medium font-headline tracking-wider">Your character awaits</p>
                    <p className="text-sm">Fill out the form to begin the creation process.</p>
                  </>
                )}
              </div>
            )}
            {characterData && (
               <div className="grid gap-8 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg">
                        <Image
                            src={characterData.imageUrl}
                            alt="Generated character portrait"
                            fill
                            className="object-cover"
                        />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                      <h3 className="font-headline text-2xl flex items-center mb-4"><FileText className="w-5 h-5 mr-2 text-primary" /> Biography</h3>
                      <div className="space-y-4 text-muted-foreground mb-6 text-sm">
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
                                  <FormLabel>Character Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Captain Kaelen" {...field} disabled={!canInteract} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={!canInteract}>
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
  );
}
