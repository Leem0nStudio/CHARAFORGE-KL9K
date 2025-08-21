
'use client';

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wand2 } from 'lucide-react';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const formatPromptText = (text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  const formattedLines = lines.map(line => {
    // 1. Remove extra spaces and fix comma placements
    let cleanedLine = line.replace(/\s*,\s*/g, ', ').replace(/,+/g, ',').trim();
    cleanedLine = cleanedLine.replace(/^,/, '').replace(/,$/, '').trim();
    
    // 2. Replace underscores with spaces
    cleanedLine = cleanedLine.replace(/_/g, ' ');

    // 3. Remove duplicate tags within the line
    const tags = cleanedLine.split(',').map(tag => tag.trim()).filter(Boolean);
    const uniqueTags = [...new Set(tags)];
    
    return uniqueTags.join(', ');
  });

  // 4. Append comma to line breaks (respecting last line)
  return formattedLines.map((line, index) => {
    if (index < formattedLines.length - 1 && line.length > 0) {
      return line.endsWith(',') ? line : `${line},`;
    }
    return line;
  }).join('\n');
};

export const PromptEditor = forwardRef<
    { format: () => void }, 
    PromptEditorProps
>(({ value, onChange, disabled }, ref) => {
  const [isAutoFormat, setIsAutoFormat] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = useCallback(() => {
    const formatted = formatPromptText(value);
    onChange(formatted);
  }, [value, onChange]);
  
  useImperativeHandle(ref, () => ({
    format: () => {
        if (isAutoFormat) {
            handleFormat();
        }
    }
  }), [isAutoFormat, handleFormat]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && (event.key === 'F' || event.key === 'f')) {
        event.preventDefault();
        handleFormat();
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
        textarea.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        if (textarea) {
            textarea.removeEventListener('keydown', handleKeyDown);
        }
    };
  }, [handleFormat]);


  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text/plain');
    const formattedText = formatPromptText(pastedText);

    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
        if (textareaRef.current) {
             const newCursorPos = start + formattedText.length;
             textareaRef.current.selectionStart = newCursorPos;
             textareaRef.current.selectionEnd = newCursorPos;
        }
    }, 0);
  };
  
  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        disabled={disabled}
        className="min-h-[250px] font-mono text-xs"
        placeholder="1girl, solo, masterpiece, best quality, looking at viewer, detailed background, ..."
      />
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-format-switch"
            checked={isAutoFormat}
            onCheckedChange={setIsAutoFormat}
            disabled={disabled}
          />
          <Label htmlFor="auto-format-switch" className="text-xs">
            Auto-format on Generate
          </Label>
        </div>
        {!isAutoFormat && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleFormat}
            disabled={disabled}
          >
            <Wand2 className="mr-2 h-4 w-4" /> Format Prompt
          </Button>
        )}
      </div>
    </div>
  );
});

PromptEditor.displayName = 'PromptEditor';
