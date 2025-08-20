
'use client';

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface PromptTagInputProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
}

// Regex to split by comma, but not inside parentheses.
const tagSplitRegex = /,\s*(?![^()]*\))/;

const parseTag = (tagStr: string): { tag: string; weight: number } => {
    // Matches (tag:1.2) or (tag)
    const weightMatch = tagStr.match(/^\(([^:]+)(?::([\d.]+))?\)$/);
    if (weightMatch) {
        return { tag: weightMatch[1], weight: weightMatch[2] ? parseFloat(weightMatch[2]) : 1.0 };
    }
    // Matches tag:1.2 (without parentheses)
     const colonWeightMatch = tagStr.match(/([^:]+):([\d.]+)$/);
    if (colonWeightMatch) {
        return { tag: colonWeightMatch[1], weight: parseFloat(colonWeightMatch[2]) };
    }
    return { tag: tagStr.replace(/[()]/g, ''), weight: 1.0 };
};

const formatTag = ({ tag, weight }: { tag: string; weight: number }): string => {
    if (Math.abs(weight - 1.0) < 0.01) {
        // If weight is 1.0, don't show it unless the original had parentheses
        return tag.includes('(') ? `(${tag})` : tag;
    }
    return `(${tag}:${weight.toFixed(1)})`;
};

export function PromptTagInput({ value, onChange, disabled }: PromptTagInputProps) {
    const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null);

    const tags = value ? value.split(tagSplitRegex).filter(Boolean) : [];

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
        <div 
            className="flex min-h-[250px] w-full flex-wrap gap-2 rounded-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            onClick={() => setSelectedTagIndex(null)} // Deselect when clicking the container
        >
            {tags.map((tagStr, index) => {
                const { tag, weight } = parseTag(tagStr);
                const isSelected = selectedTagIndex === index;

                return (
                    <div
                        key={`${tagStr}-${index}`}
                        className={cn(
                            `relative group flex items-center h-fit transition-all duration-200`,
                            isSelected && 'z-10'
                        )}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent container click from firing
                            setSelectedTagIndex(isSelected ? null : index);
                        }}
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
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center bg-background border rounded-full p-0.5 shadow-lg">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleWeightChange(index, -0.1); }} className="p-1 rounded-l-full hover:bg-muted"><Minus className="h-3 w-3"/></button>
                                <div className="w-px h-4 bg-border" />
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleWeightChange(index, 0.1); }} className="p-1 rounded-r-full hover:bg-muted"><Plus className="h-3 w-3"/></button>
                            </div>
                        )}
                    </div>
                );
            })}
            {tags.length === 0 && (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground pointer-events-none">
                    <p>Tags will appear here.</p>
                </div>
            )}
        </div>
    );
}
