
'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { DataPackFormValues } from '@/types/datapack';


interface DataPackMetadataFormProps {
    form: ReturnType<typeof useFormContext<DataPackFormValues>>;
    onFileChange: (file: File | null) => void;
}

export function DataPackMetadataForm({ form, onFileChange }: DataPackMetadataFormProps) {
  const { register, control, formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>DataPack Metadata</CardTitle>
        <CardDescription>Information about the pack shown in the public catalog.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Author</Label>
              <Input {...register('author')} />
              {errors.author && <p className="text-destructive text-sm mt-1">{errors.author.message}</p>}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...register('description')} />
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <div>
                <Label>Tags (comma-separated)</Label>
                <Controller
                    control={control}
                    name="tags"
                    render={({ field }) => (
                         <Input 
                            defaultValue={Array.isArray(field.value) ? field.value.join(', ') : ''}
                            onChange={(e) => field.onChange(e.target.value.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean))}
                         />
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Controller 
                    control={control} 
                    name="type" 
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="temporal">Temporal</SelectItem>
                            </SelectContent>
                        </Select>
                    )} 
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" {...register('price', { valueAsNumber: true })} />
              </div>
            </div>
            <div>
              <Label>Cover Image</Label>
              <Input type="file" accept="image/png" onChange={e => onFileChange(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Controller
                control={control}
                name="isNsfw"
                render={({ field }) => (
                  <div className="flex items-center space-x-2 rounded-lg border p-3">
                    <AlertTriangle className="text-destructive" />
                    <Label htmlFor="isNsfw" className="flex-grow">Mark as NSFW</Label>
                    <Switch
                      id="isNsfw"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
