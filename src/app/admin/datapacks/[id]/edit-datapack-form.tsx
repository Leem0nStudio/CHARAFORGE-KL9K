
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { upsertDataPack, deleteDataPack, getDataPackForAdmin } from '@/app/actions/datapacks';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Save } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DataPack, DataPackSchema } from '@/types/datapack';
import { DataPackFormSchema, type DataPackFormValues } from '@/types/datapack';
import { DataPackMetadataForm } from './datapack-metadata-form';
import { DataPackSchemaEditor } from './datapack-schema-editor';

// This component now fetches its own data.
export function EditDataPackForm({ packId }: { packId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [initialData, setInitialData] = useState<DataPack | null>(null);
  const [isLoading, setIsLoading] = useState(packId !== 'new');

  const form = useForm<DataPackFormValues>({
    resolver: zodResolver(DataPackFormSchema),
    defaultValues: {
      name: '',
      author: 'CharaForge',
      description: '',
      type: 'free',
      price: 0,
      tags: [],
      schema: {
        characterProfileSchema: {},
        promptTemplates: [],
      },
      isNsfw: false,
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    async function fetchData() {
      if (packId && packId !== 'new') {
        setIsLoading(true);
        const data = await getDataPackForAdmin(packId);
        if (data) {
          setInitialData(data);
          form.reset({
            name: data.name || '',
            author: data.author || 'CharaForge',
            description: data.description || '',
            type: data.type || 'free',
            price: data.price || 0,
            tags: data.tags || [],
            schema: data.schema || { characterProfileSchema: {}, promptTemplates: [] },
            isNsfw: data.isNsfw || false,
          });
        }
        setIsLoading(false);
      }
    }
    fetchData();
  }, [packId, form]);

  const handleAiSchemaGenerated = (data: {
      name: string;
      description: string;
      tags: string[];
      schema: DataPackSchema;
  }) => {
      form.setValue('name', data.name, { shouldValidate: true, shouldDirty: true });
      form.setValue('description', data.description, { shouldValidate: true, shouldDirty: true });
      form.setValue('tags', data.tags, { shouldValidate: true, shouldDirty: true });
      form.setValue('schema', data.schema, { shouldValidate: true, shouldDirty: true });
  };


  const onSubmit = (values: DataPackFormValues) => {
    startTransition(async () => {
      let imageBuffer: Buffer | undefined = undefined;
      if (coverImageFile) {
        const arrayBuffer = await coverImageFile.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
      
      const result = await upsertDataPack({ id: initialData?.id, ...values }, imageBuffer);
      
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        if (!initialData?.id && result.packId) {
             router.push(`/admin/datapacks/${result.packId}`);
        }
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
      }
    });
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    startTransition(async () => {
      const result = await deleteDataPack(initialData.id);
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        router.push('/admin/datapacks');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center p-16">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24 sm:pb-0">
       <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
            {initialData && (
                 <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isPending}>Delete</Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                         <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                         <AlertDialogDescription>This will permanently delete the DataPack and any characters created with it. This action cannot be undone.</AlertDialogDescription>
                         <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive-hover">
                                 {isPending && <Loader2 className="animate-spin mr-2"/>}
                                 Continue
                             </AlertDialogAction>
                         </AlertDialogFooter>
                     </AlertDialogContent>
                 </AlertDialog>
             )}
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                {isPending && <Loader2 className="animate-spin mr-2" />}
                {initialData ? 'Save Changes' : 'Create DataPack'}
            </Button>
        </div>

      <Tabs defaultValue="metadata">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="schema">Schema Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="metadata">
            <DataPackMetadataForm form={form} onFileChange={setCoverImageFile} />
        </TabsContent>
        <TabsContent value="schema">
            <DataPackSchemaEditor 
                form={form} 
                onAiSchemaGenerated={handleAiSchemaGenerated}
                isAiGenerating={isAiGenerating}
                onAiGeneratingChange={setIsAiGenerating}
            />
        </TabsContent>
      </Tabs>

      {/* Mobile Action Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t z-10">
          <div className="flex items-center gap-2">
            {initialData && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" className="flex-1" disabled={isPending}>
                          <Trash2 className="mr-2"/> Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogDescription>This will permanently delete the DataPack and any characters created with it. This action cannot be undone.</AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive-hover">
                                {isPending && <Loader2 className="animate-spin mr-2"/>}
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button type="submit" className="flex-1" disabled={isPending || !form.formState.isDirty}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2"/>}
                {initialData ? 'Save Changes' : 'Create'}
            </Button>
          </div>
      </div>
    </form>
  );
}
