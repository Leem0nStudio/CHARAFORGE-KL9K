
'use client';

import { useTransition } from 'react';
import type { Character } from '@/types/character';
import { updateCharacterStatus, updateCharacterDataPackSharing } from '@/app/actions/characters';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, GalleryHorizontal } from 'lucide-react';

export function EditSharingTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
    const { toast } = useToast();
    const [isUpdating, startUpdateTransition] = useTransition();

    const handleUpdate = (updateAction: () => Promise<any>, optimisticData: Partial<Character>) => {
        startUpdateTransition(async () => {
            onUpdate(optimisticData); // Optimistic update
            const result = await updateAction();
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (!result.success) {
                // Revert on failure
                onUpdate({ status: character.status, isSharedToDataPack: character.isSharedToDataPack });
            }
        });
    };

    const handleTogglePublicStatus = (checked: boolean) => {
        const newStatus = checked ? 'public' : 'private';
        handleUpdate(() => updateCharacterStatus(character.id, newStatus), { status: newStatus });
    };

    const handleToggleDataPackSharing = (checked: boolean) => {
        handleUpdate(() => updateCharacterDataPackSharing(character.id, checked), { isSharedToDataPack: checked });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sharing & Visibility</CardTitle>
                <CardDescription>Control who can see your character and where it appears.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="public-switch" className="flex items-center gap-2 font-semibold">
                            <ShieldCheck /> Public Character
                        </Label>
                        <p className="text-sm text-muted-foreground">Allow anyone to view this character in the public gallery.</p>
                    </div>
                    <Switch
                        id="public-switch"
                        checked={character.status === 'public'}
                        onCheckedChange={handleTogglePublicStatus}
                        disabled={isUpdating}
                    />
                </div>

                {character.dataPackId && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="datapack-sharing-switch" className="flex items-center gap-2 font-semibold">
                                <GalleryHorizontal /> Share to DataPack Gallery
                            </Label>
                            <p className="text-sm text-muted-foreground">Feature this character in the community gallery for its DataPack.</p>
                        </div>
                        <Switch
                            id="datapack-sharing-switch"
                            checked={!!character.isSharedToDataPack}
                            onCheckedChange={handleToggleDataPackSharing}
                            disabled={isUpdating || character.status !== 'public'}
                        />
                    </div>
                )}
                 {character.dataPackId && character.status !== 'public' && (
                    <p className="text-xs text-muted-foreground text-center">Character must be public to be shared in a DataPack gallery.</p>
                 )}
            </CardContent>
        </Card>
    );
}
