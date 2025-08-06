
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, XCircle } from 'lucide-react';
import { upsertDataPack, deleteDataPack, getDataPack } from './actions';
import type { UpsertDataPack, DataPackSchema, DataPackSchemaField } from '@/types/datapack';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.string().optional(),
  schema: z.string().refine(s => {
    try { JSON.parse(s); return true; } catch { return false; }
  }, { message: 'Must be valid JSON' }),
  options: z.array(z.object({ name: z.string(), content: z.string() }))
});

type FormValues = z.infer<typeof FormSchema>;

interface DataPackFormProps {
  children: React.ReactNode;
  dataPackId?: string;
}

export function DataPackForm({ children, dataPackId }: DataPackFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      author: 'CharaForge',
      description: '',
      type: 'free',
      price: 0,
      tags: '',
      schema: JSON.stringify({ fields: [], promptTemplate: '' }, null, 2),
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const schemaValue = form.watch('schema');

  useEffect(() => {
    if (dataPackId && isOpen) {
      setIsLoadingData(true);
      getDataPack(dataPackId).then(data => {
        if (data) {
          form.reset({
            name: data.pack.name,
            author: data.pack.author,
            description: data.pack.description,
            type: data.pack.type,
            price: data.pack.price,
            tags: data.pack.tags.join(', '),
            schema: data.schema,
            options: Object.entries(data.options).map(([name, content]) => ({ name, content })),
          });
        }
        setIsLoadingData(false);
      });
    } else {
        form.reset();
    }
  }, [dataPackId, isOpen, form]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      let imageBuffer: Buffer | undefined = undefined;
      if (coverImage) {
        const arrayBuffer = await coverImage.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }

      const dataToSave: UpsertDataPack = {
        id: dataPackId,
        name: values.name,
        author: values.author,
        description: values.description,
        type: values.type,
        price: values.price,
        tags: values.tags || '',
        schema: values.schema,
        options: values.options.reduce((acc, opt) => {
            acc[opt.name] = opt.content;
            return acc;
        }, {} as Record<string, string>)
      };

      const result = await upsertDataPack(dataToSave, imageBuffer);

      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        setIsOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  const handleDelete = () => {
    if (!dataPackId) return;
    startTransition(async () => {
        const result = await deleteDataPack(dataPackId);
         if (result.success) {
            toast({ title: 'Success!', description: result.message });
            setIsOpen(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dataPackId ? 'Edit' : 'Create'} DataPack</DialogTitle>
          <DialogDescription>
            {dataPackId ? 'Update the details for this DataPack.' : 'Fill out the form to create a new DataPack.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
             <div className="flex items-center justify-center p-24">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
             </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* Left Column - Metadata */}
          <div className="space-y-4">
            <h3 className="font-headline text-lg">Metadata</h3>
             <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}
            </div>
             <div>
                <Label htmlFor="author">Author</Label>
                <Input id="author" {...form.register('author')} />
                 {form.formState.errors.author && <p className="text-destructive text-sm mt-1">{form.formState.errors.author.message}</p>}
            </div>
             <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register('description')} />
                 {form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Type</Label>
                    <Select onValueChange={(v) => form.setValue('type', v as any)} value={form.watch('type')}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="temporal">Temporal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" {...form.register('price', { valueAsNumber: true })} />
                </div>
             </div>
             <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" {...form.register('tags')} />
            </div>
             <div>
                <Label htmlFor="cover">Cover Image</Label>
                <Input id="cover" type="file" accept="image/png" onChange={e => setCoverImage(e.target.files?.[0] || null)} />
            </div>
          </div>
          {/* Right Column - Schema & Options */}
           <div className="space-y-4">
              <h3 className="font-headline text-lg">Schema & Options</h3>
              <div>
                <Label htmlFor="schema">Schema (schema.json)</Label>
                <Textarea id="schema" {...form.register('schema')} className="min-h-[200px] font-mono text-xs" />
                 {form.formState.errors.schema && <p className="text-destructive text-sm mt-1">{form.formState.errors.schema.message}</p>}
              </div>
               <div>
                  <Label>Option Files</Label>
                  <div className="space-y-2 rounded-md border p-4">
                      {fields.map((field, index) => (
                          <div key={field.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Input {...form.register(`options.${index}.name`)} placeholder="options_file.txt" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="w-4 h-4 text-destructive"/>
                                </Button>
                              </div>
                            <Textarea {...form.register(`options.${index}.content`)} placeholder="Option 1\nOption 2" className="font-mono text-xs"/>
                          </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', content: '' })}>
                          <PlusCircle className="mr-2"/> Add Option File
                      </Button>
                  </div>
              </div>
           </div>

          <DialogFooter className="col-span-1 md:col-span-2 flex justify-between">
            <div>
                 {dataPackId && (
                     <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" disabled={isPending}>Delete</Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                             <AlertDialogDescription>This will permanently delete the DataPack and all its associated files. This action cannot be undone.</AlertDialogDescription>
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
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin mr-2" />}
              {dataPackId ? 'Save Changes' : 'Create DataPack'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
