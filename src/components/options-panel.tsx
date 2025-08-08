'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { upsertDataPack, deleteDataPack } from '@/app/actions/datapacks';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DataPack, UpsertDataPack } from '@/types/datapack';
import * as yaml from 'js-yaml';


// Zod schema for a single schema entry (key-value pair)
const SchemaEntrySchema = z.object({
  key: z.string().min(1, 'Key cannot be empty.'),
  value: z.string().min(1, 'YAML content cannot be empty.'),
});

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.string().optional(),
  // The schema is now an array of key-value pairs for the form
  schema: z.array(SchemaEntrySchema),
});

type FormValues = z.infer<typeof FormSchema>;


// Main Form Component
export function EditDataPackForm({ initialData }: { initialData: DataPack | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Convert schema object to array for useFieldArray, and back on submit
  const defaultValues = useMemo(() => {
    const schemaArray = initialData?.schema 
        ? Object.entries(initialData.schema).map(([key, value]) => ({ key, value: typeof value === 'object' ? yaml.dump(value) : value }))
        : [{ key: 'prompt_template', value: 'A simple prompt with a {variable}.' }];

    return {
      name: initialData?.name || '',
      author: initialData?.author || 'CharaForge',
      description: initialData?.description || '',
      type: initialData?.type || 'free',
      price: initialData?.price || 0,
      tags: initialData?.tags?.join(', ') || '',
      schema: schemaArray,
    };
  }, [initialData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schema",
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      let imageBuffer: Buffer | undefined = undefined;
      if (coverImage) {
        const arrayBuffer = await coverImage.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
      
      // Convert schema array back to object, parsing YAML content
      const schemaObject = values.schema.reduce((obj, item) => {
        try {
            // We parse the YAML content here before sending it to the server
            obj[item.key] = yaml.load(item.value);
        } catch (e) {
            // if it's not valid yaml, store as string. This helps with prompt_template
            obj[item.key] = item.value;
        }
        return obj;
      }, {} as { [key: string]: any });


      const dataToSave: UpsertDataPack = {
        id: initialData?.id,
        name: values.name,
        author: values.author,
        description: values.description,
        type: values.type,
        price: values.price,
        tags: values.tags || '',
        schema: schemaObject,
      };

      const result = await upsertDataPack(dataToSave, imageBuffer);
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        router.push('/admin/datapacks');
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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Tabs defaultValue="metadata">
        <div className="flex items-center justify-between mb-4">
            <TabsList>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="schema">Schema Editor</TabsTrigger>
            </TabsList>
             <div className="flex items-center gap-2">
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
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin mr-2" />}
                    {initialData ? 'Save Changes' : 'Create DataPack'}
                </Button>
            </div>
        </div>

        <TabsContent value="metadata">
          <Card>
            <CardHeader><CardTitle>DataPack Metadata</CardTitle><CardDescription>Information about the pack shown in the public catalog.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><Label>Name</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}</div>
                <div><Label>Author</Label><Input {...form.register('author')} />{form.formState.errors.author && <p className="text-destructive text-sm mt-1">{form.formState.errors.author.message}</p>}</div>
                <div><Label>Description</Label><Textarea {...form.register('description')} />{form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}</div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label><Select onValueChange={(v) => form.setValue('type', v as any)} value={form.watch('type')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="temporal">Temporal</SelectItem></SelectContent></Select></div>
                  <div><Label>Price</Label><Input type="number" {...form.register('price', { valueAsNumber: true })} /></div>
                </div>
                <div><Label>Tags (comma-separated)</Label><Input {...form.register('tags')} /></div>
                <div><Label>Cover Image</Label><Input type="file" accept="image/png" onChange={e => setCoverImage(e.target.files?.[0] || null)} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
            <Card>
                <CardHeader>
                    <CardTitle>Schema Content</CardTitle>
                    <CardDescription>Define the building blocks of your prompt. The content should be in YAML format for fields that represent lists of options (like race, class) or just a string for the template.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-muted/50">
                            <div className="col-span-3 space-y-2">
                                <Label>Schema Key</Label>
                                <Input {...form.register(`schema.${index}.key`)} placeholder="e.g., prompt_template, race, class"/>
                            </div>
                            <div className="col-span-8 space-y-2">
                                <Label>Content (String or YAML)</Label>
                                <Controller
                                    control={form.control}
                                    name={`schema.${index}.value`}
                                    render={({ field }) => (
                                        <Textarea 
                                            {...field}
                                            placeholder="- label: Human\n  value: human"
                                            className="font-mono text-xs min-h-[150px]"
                                        />
                                    )}
                                />
                            </div>
                            <div className="col-span-1 flex items-end">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ key: '', value: '' })}
                    >
                        <PlusCircle className="mr-2" /> Add Schema Entry
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}