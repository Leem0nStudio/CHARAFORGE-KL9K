
'use client';

import React, { useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CaseSensitive } from 'lucide-react';

const formatPromptText = (text: string): string => {
    if (!text) return '';
    
    let formattedText = text.replace(/_/g, ' ').replace(/\s*,\s*/g, ', ').trim();

    if (formattedText.startsWith(',')) formattedText = formattedText.substring(1).trim();
    if (formattedText.endsWith(',')) formattedText = formattedText.slice(0, -1).trim();

    const tags = formattedText.match(/(\([^)]+\)|[^,]+)/g)?.map(tag => tag.trim()).filter(Boolean) || [];
    const uniqueTags = [...new Set(tags)];
    
    return uniqueTags.join(', ');
};


interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const PromptEditor = React.forwardRef<
  { format: () => void },
  PromptEditorProps
>(({ value, onChange, disabled }, ref) => {
    
   const handleFormatClick = () => {
    const formatted = formatPromptText(value);
    onChange(formatted);
  };
    
  useImperativeHandle(ref, () => ({
    format: handleFormatClick,
  }));

  return (
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
  );
});

PromptEditor.displayName = 'PromptEditor';
