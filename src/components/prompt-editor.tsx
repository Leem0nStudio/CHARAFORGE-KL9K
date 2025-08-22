
'use client';

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wand2 } from 'lucide-react';

// Helper function to escape special characters for use in a RegExp
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};


const formatPromptText = (text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  const aliasMap = new Map<string, RegExp[]>();
  const promptLines: string[] = [];

  // First pass: extract alias definitions
  for (const line of lines) {
    // A line is an alias definition if it contains ":" and does NOT contain weighted prompts like (word:1.2)
    if (line.includes(':') && !/^\s*\(/.test(line)) {
      const [mainTag, aliasStr] = line.split(/:(.*)/s);
      if (mainTag && aliasStr) {
        const aliases = aliasStr.split(',').map(a => a.trim()).filter(Boolean);
        if (aliases.length > 0) {
            // CRITICAL FIX: Escape aliases before creating RegExp to prevent invalid expressions
            const escapedAliases = aliases.map(escapeRegExp);
            aliasMap.set(mainTag.trim(), escapedAliases.map(a => new RegExp(`\\b${a}\\b`, 'g')));
        }
        // Alias definition lines are not added to promptLines
      } else {
        promptLines.push(line);
      }
    } else {
      promptLines.push(line);
    }
  }

  let promptText = promptLines.join('\n');

  // Second pass: apply aliases
  for (const [mainTag, aliasRegexes] of aliasMap.entries()) {
    for (const regex of aliasRegexes) {
      promptText = promptText.replace(regex, mainTag);
    }
  }
  
  // Third pass: format the processed prompt
  const formattedLines = promptText.split('\n').map(line => {
    let cleanedLine = line.replace(/\s*,\s*/g, ', ').replace(/,+/g, ',').trim();
    cleanedLine = cleanedLine.replace(/^,/, '').replace(/,$/, '').trim();
    cleanedLine = cleanedLine.replace(/_/g, ' ');

    // Avoid splitting inside parentheses for weighted prompts like (word:1.2)
    const tags = cleanedLine.match(/(\([^)]+\)|[^,]+)/g)?.map(tag => tag.trim()).filter(Boolean) || [];
    const uniqueTags = [...new Set(tags)];
    
    return uniqueTags.join(', ');
  });

  return formattedLines.filter(Boolean).map((line, index, arr) => {
    if (index < arr.length - 1 && line.length > 0) {
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
        placeholder="1girl: girl, woman, lady\nmasterpiece, best quality, 1girl, solo, ..."
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
