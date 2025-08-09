
'use client';

import { useTransition } from 'react';
import type { Character } from '@/types/character';
import { updateCharacterBranchingPermissions, createCharacterVersion } from '@/app/actions/characters';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GitBranch, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function EditVersionsTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
    const { toast } = useToast();
    const router = useRouter();
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
                onUpdate({ branchingPermissions: character.branchingPermissions });
            } else if (result.characterId) {
                router.push(`/characters/${result.characterId}/edit`);
            }
        });
    };

    const handleToggleBranching = (checked: boolean) => {
        const newPermissions = checked ? 'public' : 'private';
        handleUpdate(() => updateCharacterBranchingPermissions(character.id, newPermissions), { branchingPermissions: newPermissions });
    };

    const handleCreateVersion = () => {
        // No optimistic update needed here as it creates a new entity
        startUpdateTransition(async () => {
             const result = await createCharacterVersion(character.id);
             toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success && result.characterId) {
                router.push(`/characters/${result.characterId}/edit`);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Versioning & Permissions</CardTitle>
                <CardDescription>Manage different versions of this character and control branching permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="font-semibold">Versions</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={handleCreateVersion} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="animate-spin" /> : <Plus />} New Version
                        </Button>
                        {character.versions?.sort((a,b) => b.version - a.version).map(v => (
                            <Button key={v.id} asChild variant={v.id === character.id ? 'default' : 'secondary'} size="sm">
                                <Link href={`/characters/${v.id}/edit`}>
                                    {v.name}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="branching-switch" className="flex items-center gap-2 font-semibold">
                            <GitBranch /> Allow Branching
                        </Label>
                        <p className="text-sm text-muted-foreground">Allow other users to create their own version of this character.</p>
                    </div>
                    <Switch
                        id="branching-switch"
                        checked={character.branchingPermissions === 'public'}
                        onCheckedChange={handleToggleBranching}
                        disabled={isUpdating || character.status !== 'public'}
                    />
                </div>
                 {character.status !== 'public' && (
                    <p className="text-xs text-muted-foreground text-center">Character must be public to enable branching.</p>
                 )}
            </CardContent>
        </Card>
    );
}
