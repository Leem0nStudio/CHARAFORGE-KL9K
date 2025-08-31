
'use client';

import React, { useImperativeHandle, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CaseSensitive, Tags, Wand2 } from 'lucide-react';
import type { DataPack, PromptTemplate } from '@/types/datapack';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PromptTagInput } from './prompt-tag-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { TagAssistantModal } from './tag-assistant-modal';
import { getDatasetForDataPack, createInvertedDatasetMap, findSlotKeyForTag } from '@/services/composition';


const formatPromptText = (text: string): string => {
    if (!text) return '';
    
    // Improved regex to handle tags with parentheses and weights
    const tagSplitRegex = /,\s*(?![^()]*\))/;
    const tags = text.split(tagSplitRegex).map(tag => tag.trim()).filter(Boolean);
    
    const uniqueTags = [...new Set(tags)];
    
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
    
   const [isTagAssistantOpen, setIsTagAssistantOpen] = useState(false);

   // Memoize the dataset and the inverted map so they are not re-calculated on every render.
   const { dataset, invertedMap } = useMemo(() => {
        if (!activePack) {
            return { dataset: null, invertedMap: null };
        }
        const ds = getDatasetForDataPack(activePack);
        const invMap = createInvertedDatasetMap(ds);
        return { dataset: ds, invertedMap: invMap };
   }, [activePack]);


   const handleFormatClick = () => {
        const formatted = formatPromptText(value);
        onChange(formatted);
   };
    
  useImperativeHandle(ref, () => ({
    format: handleFormatClick,
  }));
  
  const handleAppendTags = (tags: string[]) => {
      const currentPrompt = value.trim();
      const newTagsString = tags.join(', ');
      const newPrompt = currentPrompt ? `${currentPrompt}, ${newTagsString}` : newTagsString;
      onChange(formatPromptText(newPrompt));
  };
  
  const getOptionsForTag = (tag: string) => {
      if (!dataset || !invertedMap) return null;
      
      const slotKey = findSlotKeyForTag(tag, invertedMap);
      
      if (slotKey && dataset[slotKey]) {
          return dataset[slotKey];
      }

      return null;
  }

  const handleTagChange = (oldValue: string, newValue: string) => {
      // Improved regex to handle various tag formats
      const tagSplitRegex = /,\s*(?![^()]*\))/;
      const tags = value.split(tagSplitRegex);
      const newTags = tags.map(tag => {
          if (tag.trim() === oldValue.trim()) {
              return newValue;
          }
          return tag;
      });
      onChange(newTags.join(', '));
  };

  return (
    <div className="space-y-2">
        <TagAssistantModal 
            isOpen={isTagAssistantOpen}
            onClose={() => setIsTagAssistantOpen(false)}
            onAppendTags={handleAppendTags}
            currentDescription={value}
        />
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
            <div className="flex items-center justify-between">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="visual"><Wand2 className="mr-2"/>Visual Editor</TabsTrigger>
                    <TabsTrigger value="text"><CaseSensitive className="mr-2"/>Text Editor</TabsTrigger>
                </TabsList>
                 <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => setIsTagAssistantOpen(true)} disabled={disabled}>
                    <Tags className="mr-2"/> Assistant
                </Button>
            </div>
            <TabsContent value="visual" className="mt-2">
                    <PromptTagInput
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    getOptionsForTag={getOptionsForTag}
                    onTagChange={handleTagChange}
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
