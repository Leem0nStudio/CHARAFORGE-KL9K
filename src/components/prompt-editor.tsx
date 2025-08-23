
'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';

// This is a new, simplified interface for the component's props.
interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// The component is now just a simple wrapper around the Textarea.
// All complex formatting logic has been removed and will be handled by the server.
export const PromptEditor = React.forwardRef<
  HTMLTextAreaElement,
  PromptEditorProps
>(({ value, onChange, disabled }, ref) => {
  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="min-h-[250px] font-mono text-xs"
      placeholder="1girl, masterpiece, best quality, ultra-detailed, looking at viewer, green hair, armor, forest background..."
    />
  );
});

PromptEditor.displayName = 'PromptEditor';
