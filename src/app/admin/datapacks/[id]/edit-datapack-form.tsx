
'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { upsertDataPack, deleteDataPack } from '@/app/actions/datapacks';
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
import type { DataPack } from '@/types/datapack';
import { DataPackFormSchema, type DataPackFormValues } from '@/types/datapack';
import { DataPackMetadataForm } from './datapack-metadata-form';
import { DataPackSchemaEditor } from './datapack-schema-editor';


export function EditDataPackForm({ initialData }: { initialData: DataPack | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const defaultValues = useMemo<DataPackFormValues>(() => ({
      name: initialData?.name || '',
      author: initialData?.author || 'CharaForge',
      description: initialData?.description || '',
      type: initialData?.type || 'free',
      price: initialData?.price || 0,
      tags: initialData?.tags || [],
      schema: initialData?.schema || {
        promptTemplate: 'A {style} portrait of a {race} {class}.',
        slots: [],
      },
      isNsfw: initialData?.isNsfw || false,
  }), [initialData]);

  const form = useForm<DataPackFormValues>({
    resolver: zodResolver(DataPackFormSchema),
    defaultValues,
    mode: 'onChange',
  });
  
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
        // If it's a new pack, redirect to the new edit page to prevent duplicate creations
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
                         <AlertDialogDescription>This will permanently delete the DataPack. This action cannot be undone.</AlertDialogDescription>
                         <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDelete} disabled={isPending}>
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
            <DataPackSchemaEditor form={form} />
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
                        <AlertDialogDescription>This will permanently delete the DataPack. This action cannot be undone.</AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
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
