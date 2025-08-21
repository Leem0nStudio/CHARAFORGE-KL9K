
'use client';

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptTagInputProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
}

const tagSplitRegex = /,\s*(?![^()]*\))/;

const parseTag = (tagStr: string): { tag: string; weight: number } => {
    const weightMatch = tagStr.match(/^\(([^:]+)(?::([\d.]+))?\)$/);
    if (weightMatch) {
        return { tag: weightMatch[1].trim(), weight: weightMatch[2] ? parseFloat(weightMatch[2]) : 1.0 };
    }
    return { tag: tagStr.trim(), weight: 1.0 };
};

const formatTag = ({ tag, weight }: { tag: string; weight: number }): string => {
    if (Math.abs(weight - 1.0) < 0.01) {
        return tag;
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
                
                let finalDelta = delta;
                if (Math.abs(parsed.weight - 1.0) < 0.01) {
                    finalDelta = delta > 0 ? 0.5 : -0.5;
                }
                
                const newWeight = Math.max(0.1, parsed.weight + finalDelta);
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
            className="flex min-h-[250px] w-full flex-wrap content-start gap-2 rounded-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            onClick={() => setSelectedTagIndex(null)}
        >
            <AnimatePresence>
            {tags.map((tagStr, index) => {
                const { tag, weight } = parseTag(tagStr);
                const isSelected = selectedTagIndex === index;

                return (
                    <motion.div
                        key={`${tagStr}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="relative group flex items-center h-fit"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTagIndex(isSelected ? null : index);
                        }}
                    >
                        <Badge
                            variant={isSelected ? 'default' : 'secondary'}
                            className="cursor-pointer h-fit py-1 pl-3 pr-1 text-sm select-none transition-all duration-200"
                        >
                            {tag}
                            {weight !== 1.0 && <span className="ml-1.5 text-xs text-muted-foreground font-bold group-hover:text-primary-foreground">{`(${weight.toFixed(1)})`}</span>}
                             <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveTag(index); }}
                                disabled={disabled}
                                className="ml-2 rounded-full p-0.5 text-secondary-foreground/70 hover:bg-destructive hover:text-destructive-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                        <AnimatePresence>
                        {isSelected && (
                             <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center bg-card border rounded-full p-0.5 shadow-lg z-10"
                             >
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleWeightChange(index, -0.1); }} className="p-1.5 rounded-l-full hover:bg-muted"><Minus className="h-3 w-3"/></button>
                                <div className="w-px h-4 bg-border" />
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleWeightChange(index, 0.1); }} className="p-1.5 rounded-r-full hover:bg-muted"><Plus className="h-3 w-3"/></button>
                             </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
            </AnimatePresence>
            {tags.length === 0 && !disabled && (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground pointer-events-none">
                    <p>Tags will appear here.</p>
                </div>
            )}
        </div>
    );
}
