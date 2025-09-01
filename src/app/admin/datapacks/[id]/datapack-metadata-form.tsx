
'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Tag, X } from 'lucide-react';
import type { DataPackFormValues } from '@/types/datapack';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

interface DataPackMetadataFormProps {
    form: ReturnType<typeof useFormContext<DataPackFormValues>>;
    onFileChange: (file: File | null) => void;
}

// A more intuitive component for tag management.
function TagInputController({ control }: { control: any }) {
    const [inputValue, setInputValue] = React.useState('');

    return (
        <Controller
            name="tags"
            control={control}
            render={({ field }) => {
                const tags = field.value || [];

                const handleAddTag = () => {
                    const newTag = inputValue.trim().toLowerCase();
                    if (newTag && !tags.includes(newTag)) {
                        field.onChange([...tags, newTag]);
                        setInputValue('');
                    }
                };

                const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                    }
                };

                const removeTag = (tagToRemove: string) => {
                    field.onChange(tags.filter((tag: string) => tag !== tagToRemove));
                };

                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add a tag..."
                                className="flex-grow"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] bg-background/50">
                            <AnimatePresence>
                                {tags.map((tag: string) => (
                                    <motion.div
                                        key={tag}
                                        layout
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                    >
                                        <Badge variant="secondary" className="text-base">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 rounded-full p-0.5 hover:bg-destructive/20"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            }}
        />
    );
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
                <Label>Tags</Label>
                <TagInputController control={control} />
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
