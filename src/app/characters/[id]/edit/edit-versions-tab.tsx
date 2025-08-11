
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function EditVersionsTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, startUpdateTransition] = useTransition();

    const handleUpdate = (updateAction: () => Promise<any>, optimisticData?: Partial<Character>) => {
        startUpdateTransition(async () => {
            if (optimisticData) {
                onUpdate(optimisticData); // Optimistic update
            }
            const result = await updateAction();
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                 if (result.characterId) {
                    router.push(`/characters/${result.characterId}/edit`);
                } else {
                    router.refresh();
                }
            } else if (optimisticData) {
                // Revert on failure
                onUpdate({ branchingPermissions: character.branchingPermissions });
            }
        });
    };

    const handleToggleBranching = (checked: boolean) => {
        const newPermissions = checked ? 'public' : 'private';
        handleUpdate(() => updateCharacterBranchingPermissions(character.id, newPermissions), { branchingPermissions: newPermissions });
    };

    const handleCreateVersion = () => {
        handleUpdate(() => createCharacterVersion(character.id));
    };

    const canEnableBranching = character.status === 'public';

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
                            {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />} New Version
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
                
                <TooltipProvider>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="branching-switch" className="flex items-center gap-2 font-semibold">
                                <GitBranch /> Allow Branching
                            </Label>
                            <p className="text-sm text-muted-foreground">Allow other users to create their own version of this character.</p>
                        </div>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                 <div className="flex items-center">
                                      <Switch
                                        id="branching-switch"
                                        checked={character.branchingPermissions === 'public'}
                                        onCheckedChange={handleToggleBranching}
                                        disabled={isUpdating || !canEnableBranching}
                                    />
                                 </div>
                            </TooltipTrigger>
                            {!canEnableBranching && (
                                <TooltipContent>
                                    <p>Character must be public to enable branching.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}

    