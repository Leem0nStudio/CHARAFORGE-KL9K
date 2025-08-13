
'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character } from '@/types/character';
import { generateNewCharacterImage, updateCharacterImages } from '@/app/actions/character-image';
import { uploadToStorage } from '@/services/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Trash2, FileUp, Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

const UpdateImagesSchema = z.object({
    primaryImageUrl: z.string().url("A primary image must be selected."),
});
type UpdateImagesFormValues = z.infer<typeof UpdateImagesSchema>;

export function EditGalleryTab({ character }: { character: Character }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();
  
  const form = useForm<UpdateImagesFormValues>({
    resolver: zodResolver(UpdateImagesSchema),
    defaultValues: {
      primaryImageUrl: character.imageUrl,
    },
  });

  // This effect ensures the form is re-synchronized if the character prop changes
  // (e.g., after a server-side refresh).
  useEffect(() => {
    form.reset({
        primaryImageUrl: character.imageUrl,
    });
  }, [character, form]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if ((character.gallery?.length ?? 0) >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startUploadTransition(async () => {
        try {
            const fileName = `${uuidv4()}-${file.name}`;
            const destinationPath = `usersImg/${character.userId}/${character.id}/${fileName}`;
            const newImageUrl = await uploadToStorage(file, destinationPath);
            
            // Immediately update the character in the database
            const newGallery = [...(character.gallery || []), newImageUrl];
            await updateCharacterImages(character.id, newGallery, character.imageUrl);

            toast({ title: "Image Uploaded!", description: "The new image has been added to your gallery."});
            router.refresh(); // Refresh the page to get the latest state
        } catch (error) {
             const message = error instanceof Error ? error.message : "Could not upload the image.";
             toast({ variant: 'destructive', title: 'Upload Failed', description: message });
        }
    });
  };

  const handleImageGeneration = () => {
    if ((character.gallery?.length ?? 0) >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startGenerateTransition(async () => {
        // TODO: Pass a real engine config. For now, we'll use an empty one which might default or fail.
        const result = await generateNewCharacterImage(character.id, character.description, {} as any);
        if (result.success && result.newImageUrl) {
            toast({ title: "Image Generated!", description: result.message});
            router.refresh(); // The server action already updated the DB, just refresh.
        } else {
             toast({ variant: 'destructive', title: 'Generation Failed', description: result.message });
        }
    });
  };

  const handleSetPrimary = (url: string) => {
    form.setValue('primaryImageUrl', url, { shouldDirty: true });
  };
  
  const handleRemoveImage = (urlToRemove: string) => {
    const newGallery = character.gallery?.filter(url => url !== urlToRemove) || [];
    startUpdateTransition(async () => {
        const newPrimary = (form.watch('primaryImageUrl') === urlToRemove) ? (newGallery[0] || '') : form.watch('primaryImageUrl');
        const result = await updateCharacterImages(character.id, newGallery, newPrimary);
        
        toast({
            title: result.success ? 'Image Removed' : 'Update Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            router.refresh();
        }
    });
  }

  const onSubmit = (data: UpdateImagesFormValues) => {
    startUpdateTransition(async () => {
      const result = await updateCharacterImages(character.id, character.gallery || [], data.primaryImageUrl);
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
  const isLoading = isUpdating || isUploading || isGenerating;
  const gallery = character.gallery || [character.imageUrl];

  return (
     <Card>
        <CardHeader>
            <CardTitle>Image Gallery</CardTitle>
            <CardDescription>Manage your character's portraits. Upload new ones or generate them with AI.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[200px]">
                {gallery.map((url, index) => (
                    <Card key={url} className="group relative overflow-hidden">
                        <div className="relative w-full aspect-square bg-muted/20">
                            <Image src={url} alt={`Character image ${index + 1}`} fill className="w-full object-contain" />
                        </div>
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 gap-1">
                            <Button type="button" size="sm" className="w-full" onClick={() => handleSetPrimary(url)} disabled={primaryImageUrl === url}>
                                <Star className="mr-2" /> {primaryImageUrl === url ? 'Primary' : 'Set Primary'}
                            </Button>
                            <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => handleRemoveImage(url)} disabled={gallery.length <= 1 || isLoading}>
                                { isUpdating && gallery.length > 1 ? <Loader2 className="animate-spin" /> : <><Trash2 className="mr-2" /> Remove</>}
                            </Button>
                        </div>
                        {primaryImageUrl === url && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 text-xs shadow-lg">
                                <Star className="w-3 h-3 fill-current" />
                            </div>
                        )}
                    </Card>
                ))}
                {gallery.length < 10 && (
                    <Card className="flex items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary transition-colors">
                        <div className="p-4 text-center">
                            <div className="flex justify-center mb-2">
                                 <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {isUploading ? <Loader2 className="mr-2 animate-spin" /> : <FileUp className="mr-2" />} Upload
                                </Label>
                                <Input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" disabled={isLoading}/>
                            </div>
                             <p className="text-xs text-muted-foreground my-2">or</p>
                            <Button type="button" variant="outline" size="sm" onClick={handleImageGeneration} disabled={isLoading}>
                                {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                Generate
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
             <form onSubmit={form.handleSubmit(onSubmit)}>
                 <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                    <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Primary Image
                    </Button>
                </div>
             </form>
        </CardContent>
     </Card>
  );
}
