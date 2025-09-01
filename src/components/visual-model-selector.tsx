// PLAN: Create a new component to visually display a selected AI model.
// This component replaces a standard <select> dropdown for a richer UI.
//
// - It will display the model's cover image (or a placeholder icon).
// - It will show the model's name and its ID (e.g., Hugging Face repo ID).
// - The entire component will be a button that, when clicked, opens a full-modal model selector (`ModelSelectorModal`).
// - It will have a loading state to show while models are being fetched.
'use client';

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Label } from "./ui/label";
import { MediaDisplay } from "./media-display";
import { Settings, Bot } from "lucide-react";
import type { AiModel } from "@/types/ai-model";

interface VisualModelSelectorProps {
    label: string;
    model?: AiModel | null;
    onOpen: () => void;
    disabled: boolean;
    isLoading?: boolean;
}

export function VisualModelSelector({ label, model, onOpen, disabled, isLoading }: VisualModelSelectorProps) {
    
    if (isLoading) {
        return (
             <div>
                <Label>{label}</Label>
                <div className="h-auto w-full justify-start p-2 mt-1 flex items-center">
                    <Skeleton className="w-16 h-16 rounded-md shrink-0 mr-4" />
                    <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div>
            <Label>{label}</Label>
            <Button type="button" variant="outline" className="h-auto w-full justify-start p-2 mt-1" onClick={onOpen} disabled={disabled}>
                 <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted/20 mr-4">
                    {model?.coverMediaUrl ? (
                        <MediaDisplay url={model.coverMediaUrl} type={model.coverMediaType} alt={model.name || 'Model'} className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground"><Bot /></div>
                    )}
                </div>
                <div className="text-left overflow-hidden">
                    <p className="font-semibold text-card-foreground truncate">{model?.name || 'Select...'}</p>
                    <p className="text-xs text-muted-foreground truncate">{model?.hf_id || 'Click to choose a model'}</p>
                </div>
            </Button>
        </div>
    )
}
