
'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, ChevronsUpDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Option } from '@/types/datapack';

interface PromptTagInputProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
    getOptionsForTag?: (tag: string) => Option[] | null;
    onTagChange?: (oldValue: string, newValue: string) => void;
}

const tagSplitRegex = /,\s*(?![^()]*\))/;

const parseTag = (tagStr: string): { tag: string; weight: number } => {
    // Matches (tag:1.2)
    const weightMatch = tagStr.match(/^\(([^:]+):([\d.]+)\)$/);
    if (weightMatch) {
        return { tag: weightMatch[1].trim(), weight: parseFloat(weightMatch[2]) };
    }
    // Matches ((tag)) or (tag) for emphasis
    const emphasisMatch = tagStr.match(/^(\(+)([^)]+)(\)+)$/);
    if(emphasisMatch) {
        const parens = Math.min(emphasisMatch[1].length, emphasisMatch[3].length);
        // A simple linear scale: 1.1 for (tag), 1.2 for ((tag)), etc.
        return { tag: emphasisMatch[2].trim(), weight: 1.0 + (parens * 0.1) };
    }

    return { tag: tagStr.trim(), weight: 1.0 };
};

const formatTag = ({ tag, weight }: { tag: string; weight: number }): string => {
    // Round to one decimal place to avoid floating point issues
    const roundedWeight = Math.round(weight * 10) / 10;
    if (Math.abs(roundedWeight - 1.0) < 0.01) {
        return tag;
    }
    return `(${tag}:${roundedWeight.toFixed(1)})`;
};


export function PromptTagInput({ value, onChange, disabled, getOptionsForTag, onTagChange }: PromptTagInputProps) {
    const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null);

    const tags = value ? value.split(tagSplitRegex).filter(Boolean) : [];

    const handleWeightChange = (indexToChange: number, delta: number) => {
        if (disabled || !onTagChange) return;
        const oldTagStr = tags[indexToChange];
        const parsed = parseTag(oldTagStr);
        // Ensure weight doesn't go below a certain threshold, e.g., 0.1
        const newWeight = Math.max(0.1, parsed.weight + delta);
        const newTagStr = formatTag({ tag: parsed.tag, weight: newWeight });
        onTagChange(oldTagStr, newTagStr);
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
                const options = getOptionsForTag ? getOptionsForTag(tag) : null;
                const hasAlternatives = options && options.length > 1;

                return (
                    <motion.div
                        key={`${tagStr}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="relative group flex items-center h-fit"
                    >
                         <Popover>
                            <PopoverTrigger asChild disabled={!hasAlternatives}>
                                <Badge
                                    variant={isSelected ? 'default' : 'secondary'}
                                    className="cursor-pointer h-fit py-1 pl-3 pr-1 text-sm select-none transition-all duration-200 flex items-center"
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTagIndex(isSelected ? null : index);
                                    }}
                                >
                                    {tag}
                                    {weight !== 1.0 && <span className="ml-1.5 text-xs text-muted-foreground font-bold group-hover:text-primary-foreground">{`(${weight.toFixed(1)})`}</span>}
                                    {hasAlternatives && <ChevronsUpDown className="h-3 w-3 ml-1 text-muted-foreground/70"/>}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveTag(index); }}
                                        disabled={disabled}
                                        className="ml-2 rounded-full p-0.5 text-secondary-foreground/70 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            </PopoverTrigger>
                             <PopoverContent className="w-[200px] p-0" onClick={e => e.stopPropagation()}>
                                <Command>
                                    <CommandInput placeholder="Search options..." />
                                    <CommandList>
                                        <CommandEmpty>No other options found.</CommandEmpty>
                                        <CommandGroup>
                                            {options?.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onSelect={() => {
                                                    if (onTagChange) onTagChange(tag, option.value);
                                                }}
                                            >
                                                {option.label}
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

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
                    <p>Enter a prompt or use the Tag Assistant.</p>
                </div>
            )}
        </div>
    );
}
