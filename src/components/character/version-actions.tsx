
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCharacterVersion, updateCharacterBranchingPermissions } from '@/app/actions/characters';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, GitBranch, Loader2 } from 'lucide-react';
import type { Character } from '@/types/character';

interface VersionActionsProps {
    character: Character;
    onUpdate: (updateAction: () => Promise<any>) => void;
}

export function VersionActions({ character, onUpdate }: VersionActionsProps) {
    const [isUpdating, startUpdateTransition] = useTransition();
    const router = useRouter();

    const handleCreateVersion = () => {
        onUpdate(async () => {
            const result = await createCharacterVersion(character.id);
            if (result.success && result.characterId) {
                // Redirect to the new version
                router.push(`/characters/${result.characterId}`);
            }
            return result;
        });
    };

    const handleToggleBranching = () => {
        const newPermissions = character.branchingPermissions === 'public' ? 'private' : 'public';
        onUpdate(() => updateCharacterBranchingPermissions(character.id, newPermissions));
    };
    
    return (
        <div className="p-2 space-y-4">
            <div className="flex flex-col space-y-2">
                <Label className="font-semibold">Versions</Label>
                <div className="flex flex-wrap gap-1">
                     <Button variant="outline" size="sm" onClick={handleCreateVersion} disabled={isUpdating}>
                        <Plus className="mr-2" /> New
                    </Button>
                    {character.versions?.sort((a,b) => b.version - a.version).map(v => (
                        <Button key={v.id} asChild variant={v.id === character.id ? 'default' : 'secondary'} size="sm">
                            <Link href={`/characters/${v.id}`}>
                                {v.name}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>
             <div className="flex flex-col space-y-2">
                <Label className="font-semibold">Permissions</Label>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                         <GitBranch className="text-muted-foreground" />
                        <Label htmlFor="branching-switch" className="text-sm">Allow Branching</Label>
                    </div>
                    <Switch
                        id="branching-switch"
                        checked={character.branchingPermissions === 'public'}
                        onCheckedChange={handleToggleBranching}
                        disabled={isUpdating}
                    />
                </div>
            </div>
        </div>
    );
}
