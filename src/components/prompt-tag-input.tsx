
'use client';

import { X } from 'lucide-react';
import { Badge } from './ui/badge';

interface PromptTagInputProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
}

export function PromptTagInput({ value, onChange, disabled }: PromptTagInputProps) {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);

    const handleRemoveTag = (indexToRemove: number) => {
        if (disabled) return;
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        onChange(newTags.join(', '));
    };

    return (
        <div className="flex min-h-[250px] w-full flex-wrap gap-2 rounded-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
            {tags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="secondary" className="h-fit py-1 pl-3 pr-1 text-sm">
                    {tag}
                    <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        disabled={disabled}
                        className="ml-2 rounded-full p-0.5 text-secondary-foreground/70 hover:bg-destructive hover:text-destructive-foreground"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            {tags.length === 0 && (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <p>Tags will appear here.</p>
                </div>
            )}
        </div>
    );
}
