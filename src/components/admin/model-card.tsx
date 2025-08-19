
'use client';

import { useTransition } from 'react';
import { ModelForm } from '@/components/admin/model-form';
import { MediaDisplay } from '@/components/media-display';
import type { AiModel } from '@/types/ai-model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { syncModelToStorage } from '@/app/admin/models/actions';
import { User } from 'lucide-react';

// This component is defined and used only within this file.

function SyncButton({ model }: { model: AiModel }) {
    const [isSyncing, startSyncTransition] = useTransition();
    const { toast } = useToast();

    const handleSync = () => {
        startSyncTransition(async () => {
            const result = await syncModelToStorage(model.id);
            if (result.success) {
                toast({ title: 'Sync Started', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Sync Failed', description: result.error || result.message });
            }
        });
    }
    
    // Only show the sync button if the model is from Civitai.
    if (!model.civitaiModelId) {
        return null;
    }

    const syncStatus = model.syncStatus || 'notsynced';
    
    const statusMap = {
        notsynced: { text: 'Sync Now', color: 'bg-blue-600 hover:bg-blue-700', disabled: false, animate: false },
        syncing: { text: 'Syncing...', color: 'bg-amber-500', disabled: true, animate: true },
        synced: { text: 'Synced', color: 'bg-green-600', disabled: true, animate: false },
    }
    const currentStatus = statusMap[syncStatus];

    return (
        <Button 
            size="sm" 
            className={cn("w-full mt-2", currentStatus.color, currentStatus.animate && "animate-pulse")}
            disabled={currentStatus.disabled || isSyncing}
            onClick={handleSync}
        >
            {isSyncing ? "Please Wait..." : currentStatus.text}
        </Button>
    )
}


export function ModelCard({ model }: { model: AiModel }) {
    return (
        <Card className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
                 <div className="relative aspect-[4/3] bg-muted/20">
                     <MediaDisplay
                        url={model.coverMediaUrl}
                        type={model.coverMediaType}
                        alt={model.name}
                     />
                 </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    {model.userId && (
                        <Badge variant="secondary" className="shrink-0">
                            <User className="mr-1.5" /> User Model
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-xs truncate">{model.hf_id}</CardDescription>
                {model.triggerWords && model.triggerWords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {model.triggerWords.slice(0, 4).map(word => <Badge key={word} variant="outline">{word}</Badge>)}
                        {model.triggerWords.length > 4 && <Badge variant="outline">...</Badge>}
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-2">
                <ModelForm isEditing model={model} />
                <SyncButton model={model} />
            </CardFooter>
        </Card>
    )
}
