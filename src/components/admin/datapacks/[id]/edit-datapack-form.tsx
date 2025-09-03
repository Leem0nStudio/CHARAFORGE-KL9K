

'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { upsertDataPack, deleteDataPack, getDataPackForAdmin, createDataPackFromFiles } from '@/app/actions/datapacks';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Save, FileUp } from 'lucide-react';
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
import { AiGeneratorDialog } from './ai-generator-dialog';
import yaml from 'js-yaml';


function ImportTab({ onImportSuccess }: { onImportSuccess: (packId: string) => void }) {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);

    const handleImport = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        if (!formData.get('name')) {
            toast({ variant: 'destructive', title: 'Error', description: 'DataPack name is required.' });
            return;
        }
        if (!file) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a .zip, .yaml, or .txt file.' });
            return;
        }
        
        startTransition(async () => {
            const result = await createDataPackFromFiles(formData);
            if (result.success && result.packId) {
                toast({ title: 'Success!', description: result.message });
                onImportSuccess(result.packId);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
            }
        });
    }

    return (
        <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">New DataPack Name</Label>
                <Input name="name" id="name" placeholder="e.g., The Genesis Engine" required/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="wildcardFiles">Wildcard Archive (.zip, .yaml, .txt)</Label>
                <Input 
                  name="wildcardFiles" 
                  id="wildcardFiles" 
                  type="file" 
                  accept=".zip,.yaml,.yml,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground">Upload a file. The system will intelligently parse it to build the schema.</p>
            </div>
            <Button type="submit" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <FileUp className="mr-2"/>}
                Create from File
            </Button>
        </form>
    )
}

// This component now fetches its own data.
export function EditDataPackForm({ packId }: { packId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [initialData, setInitialData] = useState<DataPack | null>(null);
  const [isLoading, setIsLoading] = useState(packId !== 'new');
  const [activeTab, setActiveTab] = useState(packId === 'new' ? 'import' : 'metadata');

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
      imported: false,
    },
    mode: 'onChange',
  });
  
  const fetchDataAndResetForm = async (id: string) => {
      setIsLoading(true);
      try {
        const data = await getDataPackForAdmin(id);
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
            imported: data.imported || false,
          });
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch DataPack data.' });
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    if (packId && packId !== 'new') {
       fetchDataAndResetForm(packId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

 const handleAiSchemaGenerated = (schemaYaml: string) => {
    try {
        const aiData = yaml.load(schemaYaml) as any;
        
        // This is a simplified merge. A more robust solution might use a deep merge library.
        form.setValue('name', aiData.name || form.getValues('name'));
        form.setValue('description', aiData.description || form.getValues('description'));
        form.setValue('tags', aiData.tags || form.getValues('tags'));
        
        const currentSchema = form.getValues('schema');
        const newSchema = {
            promptTemplates: aiData.schema?.promptTemplates || currentSchema.promptTemplates,
            characterProfileSchema: {
                ...currentSchema.characterProfileSchema,
                ...(aiData.schema?.characterProfileSchema || {})
            }
        };
        form.setValue('schema', newSchema);

    } catch (e) {
        toast({ variant: 'destructive', title: 'YAML Parse Error', description: 'The AI returned invalid YAML content.' });
    }
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

  const handleImportSuccess = (newPackId: string) => {
    router.push(`/admin/datapacks/${newPackId}`, { scroll: false });
    fetchDataAndResetForm(newPackId);
    setActiveTab('metadata');
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center p-16">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const isImported = form.watch('imported');

  return (
    <FormProvider {...form}>
      <div className="pb-24 sm:pb-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
             <TabsList>
              <TabsTrigger value="import" disabled={packId !== 'new'}>Import</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="schema">Schema Editor</TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex items-center justify-end gap-2">
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
                                    <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive-hover">
                                        {isPending && <Loader2 className="animate-spin mr-2"/>}
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending || (!form.formState.isDirty && !!initialData)}>
                    {isPending && <Loader2 className="animate-spin mr-2" />}
                    {initialData ? 'Save Changes' : 'Create DataPack'}
                </Button>
            </div>
          </div>
         
          <div className="flex-grow">
              <TabsContent value="import">
                  <Card>
                      <CardHeader>
                          <CardTitle>Import from File</CardTitle>
                          <CardDescription>Create a new DataPack by uploading a wildcard file (.zip, .yaml, .txt).</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ImportTab onImportSuccess={handleImportSuccess} />
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="metadata">
                <DataPackMetadataForm form={form} onFileChange={setCoverImageFile} />
              </TabsContent>
              <TabsContent value="schema">
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <AiGeneratorDialog 
                                onSchemaGenerated={handleAiSchemaGenerated}
                                onGeneratingChange={setIsAiGenerating}
                            />
                        </div>
                        <DataPackSchemaEditor 
                            form={form} 
                            isAiGenerating={isAiGenerating}
                        />
                    </div>
              </TabsContent>
          </div>
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
                              <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive-hover">
                                  {isPending && <Loader2 className="animate-spin mr-2"/>}
                                  Continue
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              )}
              <Button onClick={form.handleSubmit(onSubmit)} className="flex-1" disabled={isPending || (!form.formState.isDirty && !!initialData)}>
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2"/>}
                  {initialData ? 'Save' : 'Create'}
              </Button>
            </div>
        </div>
      </div>
    </FormProvider>
  );
}
