
'use client';

import { useTransition } from 'react';
import { ModelForm } from '@/components/admin/model-form';
import { MediaDisplay } from '@/components/media-display';
import type { AiModel } from '@/types/ai-model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { syncModelDirectly } from '@/app/actions/tasks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, Download, FlaskConical, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// This component is defined and used only within this file.

function SyncButton({ model }: { model: AiModel }) {
    const [isSyncing, startSyncTransition] = useTransition();
    const { toast } = useToast();

    const handleSync = () => {
        startSyncTransition(async () => {
            const result = await syncModelDirectly(model.id);
            if (result.success) {
                toast({ title: 'Sync Complete', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Sync Failed', description: result.error || result.message });
            }
        });
    }
    
    if (!model.civitaiModelId) {
        return null;
    }

    const syncStatus = model.syncStatus || 'notsynced';
    
    const statusMap = {
        notsynced: { text: 'Sync Model', icon: <Download className="mr-2"/>, color: 'bg-blue-600 hover:bg-blue-700', disabled: false },
        queued: { text: 'Queued', icon: <Loader2 className="mr-2 animate-pulse"/>, color: 'bg-gray-500', disabled: true },
        syncing: { text: 'Syncing...', icon: <Loader2 className="mr-2 animate-spin"/>, color: 'bg-amber-500', disabled: true },
        synced: { text: 'Synced', icon: <CheckCircle className="mr-2"/>, color: 'bg-green-600', disabled: true },
        error: { text: 'Sync Error - Retry', icon: <AlertTriangle className="mr-2"/>, color: 'bg-red-600 hover:bg-red-700', disabled: false },
    }
    const currentStatus = statusMap[syncStatus];

    const button = (
        <Button 
            size="sm" 
            className={cn("w-full mt-2", currentStatus.color)}
            disabled={currentStatus.disabled || isSyncing}
            onClick={handleSync}
        >
            {isSyncing ? <Loader2 className="mr-2 animate-spin"/> : currentStatus.icon}
            {isSyncing ? "Please Wait..." : currentStatus.text}
        </Button>
    );

    if (syncStatus === 'error' && model.syncError) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs">Error: {model.syncError}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return button;
}


export function ModelCard({ model }: { model: AiModel }) {
    const isMixedModel = !!model.mixRecipe;

    return (
        <Card className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
                 <div className="relative aspect-[4/3] bg-muted/20">
                     <MediaDisplay
                        url={model.coverMediaUrl}
                        type={model.coverMediaType}
                        alt={model.name}
                     />
                     {isMixedModel && (
                         <div className="absolute top-2 left-2">
                             <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                                <FlaskConical className="mr-1.5"/> Mixed
                             </Badge>
                         </div>
                     )}
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
