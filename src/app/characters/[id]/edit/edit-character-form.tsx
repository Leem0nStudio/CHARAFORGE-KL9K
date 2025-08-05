
'use client';

import { useEffect, useState, useTransition, useActionState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import type { Character } from '@/types/character';
import { updateCharacter, updateCharacterImages } from '@/app/characters/actions';
import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text';
import { useToast } from '@/hooks/use-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Pencil, Languages, ImagePlus, Trash2, Star, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image';
import { Label } from '@/components/ui/label';

// #region Schemas and Types
const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
});

const ImageSchema = z.object({
  url: z.string().url("Please enter a valid URL."),
});

const UpdateImagesSchema = z.object({
    images: z.array(ImageSchema).min(1, "At least one image is required.").max(10, "You can add a maximum of 10 images."),
    primaryImageUrl: z.string().url("A primary image must be selected."),
});

type UpdateCharacterFormValues = z.infer<typeof UpdateCharacterSchema>;
type UpdateImagesFormValues = z.infer<typeof UpdateImagesSchema>;
// #endregion

// #region Sub-components
function EditTab({ character, onBiographyUpdate }: { character: Character, onBiographyUpdate: (newBio: string) => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, startUpdateTransition] = useTransition();

    const form = useForm<UpdateCharacterFormValues>({
        resolver: zodResolver(UpdateCharacterSchema),
        defaultValues: {
            name: character.name,
            biography: character.biography,
        },
    });

    const bioValue = form.watch('biography');
    useEffect(() => {
        onBiographyUpdate(bioValue);
    }, [bioValue, onBiographyUpdate]);

    useEffect(() => {
        form.setValue('biography', character.biography);
    }, [character.biography, form]);
    
    const onSubmit = (data: UpdateCharacterFormValues) => {
        startUpdateTransition(async () => {
            const result = await updateCharacter(character.id, data);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                router.refresh();
            }
        });
    };
    
    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Character Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="biography">Biography</Label>
                <Textarea id="biography" {...form.register('biography')} className="min-h-[250px] w-full" />
                 {form.formState.errors.biography && <p className="text-sm font-medium text-destructive">{form.formState.errors.biography.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}

function TranslateTab({ currentBiography, onBiographyUpdate }: { currentBiography: string; onBiographyUpdate: (newBio: string) => void }) {
  const { toast } = useToast();
  const [isTranslating, startTranslation] = useTransition();
  const [targetLanguage, setTargetLanguage] = useState<TranslateTextInput['targetLanguage'] | ''>('');

  const handleTranslate = () => {
    if (!targetLanguage) {
      toast({ variant: 'destructive', title: 'No Language Selected', description: 'Please select a language to translate to.' });
      return;
    }
    startTranslation(async () => {
      try {
        const result = await translateText({ text: currentBiography, targetLanguage });
        onBiographyUpdate(result.translatedText);
        toast({ title: 'Translation Complete!', description: `Biography translated to ${targetLanguage}. Review and save your changes in the 'Edit' tab.` });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Translation Failed', description: message });
      }
    });
  };

  return (
    <div className="space-y-4">
        <p className="text-muted-foreground">
            Use AI to translate the current biography. The result will replace the text in the "Edit" tab. Remember to save your changes after translating.
        </p>
        <div className="flex items-center gap-2">
             <Select onValueChange={(value: TranslateTextInput['targetLanguage']) => setTargetLanguage(value)} value={targetLanguage}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleTranslate} disabled={isTranslating || !targetLanguage}>
                {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Languages className="mr-2 h-4 w-4" />
                Translate
            </Button>
        </div>
    </div>
  );
}

function ImagesTab({ character }: { character: Character }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [newImageUrl, setNewImageUrl] = useState('');

  const form = useForm<UpdateImagesFormValues>({
    resolver: zodResolver(UpdateImagesSchema),
    defaultValues: {
      images: character.gallery?.map(url => ({ url })) || [{ url: character.imageUrl }],
      primaryImageUrl: character.imageUrl,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "images",
  });
  
  useEffect(() => {
    form.reset({
      images: character.gallery?.map(url => ({ url })) || [{ url: character.imageUrl }],
      primaryImageUrl: character.imageUrl,
    });
  }, [character, form]);


  const handleAddImage = () => {
    const result = ImageSchema.safeParse({ url: newImageUrl });
    if (result.success) {
      if (fields.length >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
      }
      append({ url: newImageUrl });
      setNewImageUrl('');
    } else {
        toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid image URL.' });
    }
  };

  const handleSetPrimary = (url: string) => {
    form.setValue('primaryImageUrl', url, { shouldDirty: true });
  };

  const onSubmit = (data: UpdateImagesFormValues) => {
    startUpdateTransition(async () => {
      const result = await updateCharacterImages(character.id, data.images.map(img => img.url), data.primaryImageUrl);
      toast({
            title: result.success ? 'Success!' : 'Update Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const primaryImageUrl = form.watch('primaryImageUrl');

  return (
     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fields.map((field, index) => (
             <Card key={field.id} className="group relative overflow-hidden">
                <Image src={field.url} alt={`Character image ${index + 1}`} width={200} height={200} className="w-full aspect-square object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 gap-1">
                    <Button type="button" size="sm" className="w-full" onClick={() => handleSetPrimary(field.url)} disabled={primaryImageUrl === field.url}>
                        <Star className="mr-2" /> {primaryImageUrl === field.url ? 'Primary' : 'Set Primary'}
                    </Button>
                    <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="mr-2" /> Remove
                    </Button>
                </div>
                {primaryImageUrl === field.url && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 text-xs shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                )}
             </Card>
          ))}
       </div>
        {form.formState.errors.images && <p className="text-sm font-medium text-destructive">{form.formState.errors.images.message}</p>}
       
        <Card>
            <CardHeader>
                <CardTitle>Add New Image</CardTitle>
                <CardDescription>Paste an image URL below to add it to the gallery.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
                 <Input 
                    placeholder="https://example.com/image.png"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                 <Button type="button" onClick={handleAddImage}><PlusCircle /> Add</Button>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Image Gallery
            </Button>
        </div>
     </form>
  );
}

// #endregion


export function EditCharacterForm({ character }: { character: Character }) {
    const [characterState, setCharacterState] = useState(character);

    const handleBiographyUpdate = useCallback((newBio: string) => {
        setCharacterState(prevState => ({ ...prevState, biography: newBio }));
    }, []);

    return (
        <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="edit"><Pencil className="mr-2" />Edit Details</TabsTrigger>
                <TabsTrigger value="translate"><Languages className="mr-2" />Translate Bio</TabsTrigger>
                <TabsTrigger value="images"><ImagePlus className="mr-2" />Manage Images</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
                 <Card>
                    <CardHeader>
                        <CardTitle>Core Details</CardTitle>
                        <CardDescription>Modify the fields below to update your character.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EditTab character={characterState} onBiographyUpdate={handleBiographyUpdate} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="translate">
                 <Card>
                    <CardHeader>
                        <CardTitle>Translate Biography</CardTitle>
                        <CardDescription>Use AI to translate the character's story into another language.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <TranslateTab 
                           currentBiography={characterState.biography} 
                           onBiographyUpdate={handleBiographyUpdate}
                       />
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="images">
                 <Card>
                    <CardHeader>
                        <CardTitle>Image Gallery</CardTitle>
                        <CardDescription>Add or remove images, and set a primary image for your character.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ImagesTab character={characterState} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

    