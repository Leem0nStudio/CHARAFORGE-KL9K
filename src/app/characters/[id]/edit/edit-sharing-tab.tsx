

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Character } from '@/types/character';
import { updateCharacterStatus, updateCharacterDataPackSharing } from '@/app/actions/character-write';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, GalleryHorizontal } from 'lucide-react';

export function EditSharingTab({ character }: { character: Character }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, startUpdateTransition] = useTransition();

    const handleUpdate = (updateAction: () => Promise<any>) => {
        startUpdateTransition(async () => {
            const result = await updateAction();
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                router.refresh();
            }
        });
    };

    const handleTogglePublicStatus = (checked: boolean) => {
        const newStatus = checked ? 'public' : 'private';
        handleUpdate(() => updateCharacterStatus(character.id, newStatus));
    };

    const handleToggleDataPackSharing = (checked: boolean) => {
        handleUpdate(() => updateCharacterDataPackSharing(character.id, checked));
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
                        checked={character.meta.status === 'public'}
                        onCheckedChange={handleTogglePublicStatus}
                        disabled={isUpdating}
                    />
                </div>

                {character.meta.dataPackId && (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="datapack-sharing-switch" className="flex items-center gap-2 font-semibold">
                                <GalleryHorizontal /> Share to DataPack Gallery
                            </Label>
                            <p className="text-sm text-muted-foreground">Feature this character in the community gallery for its DataPack.</p>
                        </div>
                        <Switch
                            id="datapack-sharing-switch"
                            checked={!!character.settings.isSharedToDataPack}
                            onCheckedChange={handleToggleDataPackSharing}
                            disabled={isUpdating || character.meta.status !== 'public'}
                        />
                    </div>
                )}
                 {character.meta.dataPackId && character.meta.status !== 'public' && (
                    <p className="text-xs text-muted-foreground text-center">Character must be public to be shared in a DataPack gallery.</p>
                 )}
            </CardContent>
        </Card>
    );
}
