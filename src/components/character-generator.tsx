"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateCharacterBio } from "@/ai/flows/generate-character-bio";
import { generateCharacterImage } from "@/ai/flows/generate-character-image";
import { Skeleton } from "./ui/skeleton";

const FormSchema = z.object({
  description: z.string().min(20, {
    message: "Please enter a more detailed description (at least 20 characters).",
  }).max(1000, {
    message: "Description must not be longer than 1000 characters."
  }),
});

type CharacterData = {
  bio: string;
  imageUrl: string;
};

export function CharacterGenerator() {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setCharacterData(null);

    try {
      const [bioResult, imageResult] = await Promise.all([
        generateCharacterBio({ description: data.description }),
        generateCharacterImage({ description: data.description }),
      ]);

      if (!bioResult.biography || !imageResult.imageUrl) {
        throw new Error("AI generation failed. One or both outputs were empty.");
      }

      setCharacterData({
        bio: bioResult.biography,
        imageUrl: imageResult.imageUrl,
      });

    } catch (error) {
      console.error("Character generation error:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was a problem creating your character. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="generator" className="container my-12">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Character Details</CardTitle>
              <CardDescription>
                Provide a description, and our AI will craft a unique biography and portrait for your character.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Character Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., A grizzled space pirate with a cybernetic eye, a long trench coat, and a sarcastic parrot on their shoulder. They are haunted by a past betrayal..."
                            className="min-h-[150px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full font-headline text-lg bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? (
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
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="min-h-full">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Generated Character</CardTitle>
              <CardDescription>
                The result of your creative spark and our AI's magic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
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
              {!isLoading && !characterData && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[300px] border-2 border-dashed rounded-lg bg-card">
                  <Wand2 className="h-12 w-12 mb-4 text-primary" />
                  <p className="text-lg font-medium font-headline tracking-wider">Your character awaits</p>
                  <p className="text-sm">Fill out the form to begin the creation process.</p>
                </div>
              )}
              {characterData && (
                 <div className="grid gap-8 md:grid-cols-5">
                    <div className="md:col-span-2">
                      <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg">
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
                        <div className="space-y-4 text-muted-foreground">
                          {characterData.bio.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                        </div>
                    </div>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
