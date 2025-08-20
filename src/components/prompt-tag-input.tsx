
'use client';

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';

interface PromptTagInputProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
}

// Regex to parse tags, including those with weights like (tag:1.2)
const tagRegex = /((?:\([^)]+\)|[^\s,()]+)+)/g;

const parseTag = (tagStr: string): { tag: string; weight: number } => {
    const weightMatch = tagStr.match(/\(([^:]+):([\d.]+)\)/);
    if (weightMatch) {
        return { tag: weightMatch[1], weight: parseFloat(weightMatch[2]) };
    }
    return { tag: tagStr, weight: 1.0 };
};

const formatTag = ({ tag, weight }: { tag: string; weight: number }): string => {
    if (weight === 1.0) {
        return tag;
    }
    return `(${tag}:${weight.toFixed(1)})`;
};

export function PromptTagInput({ value, onChange, disabled }: PromptTagInputProps) {
    const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null);

    const tags = value.match(tagRegex) || [];

    const handleWeightChange = (indexToChange: number, delta: number) => {
        if (disabled) return;

        const newTags = tags.map((tagStr, index) => {
            if (index === indexToChange) {
                const parsed = parseTag(tagStr);
                const newWeight = Math.max(0.1, parsed.weight + delta);
                return formatTag({ tag: parsed.tag, weight: newWeight });
            }
            return tagStr;
        });

        onChange(newTags.join(', '));
    };

    const handleRemoveTag = (indexToRemove: number) => {
        if (disabled) return;
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        onChange(newTags.join(', '));
        setSelectedTagIndex(null);
    };

    return (
        <div className="flex min-h-[250px] w-full flex-wrap gap-2 rounded-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
            {tags.map((tagStr, index) => {
                const { tag, weight } = parseTag(tagStr);
                const isSelected = selectedTagIndex === index;

                return (
                    <div
                        key={`${tagStr}-${index}`}
                        className={`relative group flex items-center h-fit transition-all duration-200 ${isSelected ? 'z-10' : ''}`}
                        onClick={() => setSelectedTagIndex(isSelected ? null : index)}
                    >
                        <Badge
                            variant="secondary"
                            className="cursor-pointer h-fit py-1 pl-3 pr-1 text-sm select-none"
                        >
                            {tag}
                            {weight !== 1.0 && <span className="ml-1.5 text-xs text-muted-foreground font-bold">({weight.toFixed(1)})</span>}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveTag(index); }}
                                disabled={disabled}
                                className="ml-2 rounded-full p-0.5 text-secondary-foreground/70 hover:bg-destructive hover:text-destructive-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                        {isSelected && (
                            <div className="absolute -top-4 flex items-center bg-background border rounded-full p-0.5 shadow-lg">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleWeightChange(index, -0.1); }} className="p-1 rounded-full hover:bg-muted"><Minus className="h-3 w-3"/></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleWeightChange(index, 0.1); }} className="p-1 rounded-full hover:bg-muted"><Plus className="h-3 w-3"/></button>
                            </div>
                        )}
                    </div>
                );
            })}
            {tags.length === 0 && (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <p>Tags will appear here.</p>
                </div>
            )}
        </div>
    );
}
