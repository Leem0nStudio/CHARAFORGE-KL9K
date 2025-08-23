
'use client';

import React, { useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CaseSensitive, Tags, Package, Wand2 } from 'lucide-react';
import type { DataPack, PromptTemplate } from '@/types/datapack';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PromptTagInput } from './prompt-tag-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


const formatPromptText = (text: string): string => {
    if (!text) return '';
    
    // Improved regex to handle tags with parentheses and weights
    const tagSplitRegex = /,\s*(?![^()]*\))/;
    let tags = text.split(tagSplitRegex).map(tag => tag.trim()).filter(Boolean);
    
    let uniqueTags = [...new Set(tags)];
    
    return uniqueTags.join(', ');
};

interface PromptEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    activePack: DataPack | null;
    selectedTemplate: PromptTemplate | null;
    onTemplateChange: (templateName: string) => void;
}

export const PromptEditor = React.forwardRef<
  { format: () => void },
  PromptEditorProps
>(({ value, onChange, disabled, activePack, selectedTemplate, onTemplateChange }, ref) => {
    
   const handleFormatClick = () => {
        const formatted = formatPromptText(value);
        onChange(formatted);
   };
    
  useImperativeHandle(ref, () => ({
    format: handleFormatClick,
  }));

  return (
    <div className="space-y-2">
        {activePack && selectedTemplate && (
            <div className="space-y-1">
                 <Label>Prompt Template</Label>
                 <Select 
                    onValueChange={onTemplateChange}
                    defaultValue={selectedTemplate.name}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a prompt template..." />
                    </SelectTrigger>
                    <SelectContent>
                        {activePack.schema.promptTemplates.map(t => (
                            <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
        <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual"><Wand2 className="mr-2"/>Visual Editor</TabsTrigger>
                <TabsTrigger value="text"><CaseSensitive className="mr-2"/>Text Editor</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="mt-2">
                    <PromptTagInput
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            </TabsContent>
                <TabsContent value="text" className="mt-2">
                <div className="relative">
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="min-h-[250px] font-mono text-xs pr-12"
                    placeholder="1girl, masterpiece, best quality, ultra-detailed, looking at viewer, green hair, armor, forest background..."
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleFormatClick}
                    disabled={disabled}
                    title="Format Prompt"
                >
                    <CaseSensitive className="h-4 w-4" />
                </Button>
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
});

PromptEditor.displayName = 'PromptEditor';
