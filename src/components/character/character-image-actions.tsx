
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { deleteCharacter, updateCharacterStatus, updateCharacterDataPackSharing } from '@/app/actions/characters';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Settings, Pencil, Trash2, ShieldCheck, ShieldOff, GalleryHorizontal } from 'lucide-react';
import { VersionActions } from './version-actions';
import { BranchButton } from '@/app/characters/[id]/branch-button';
import type { Character } from '@/types/character';

interface CharacterImageActionsProps {
    character: Character;
    currentUserId: string | null;
    isOwner: boolean;
}

export function CharacterImageActions({ character, currentUserId, isOwner }: CharacterImageActionsProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, startUpdateTransition] = useTransition();

    const handleUpdate = (updateAction: () => Promise<any>) => {
        startUpdateTransition(async () => {
            try {
                const result = await updateAction();
                toast({
                    title: result.success ? 'Success!' : 'Update Failed',
                    description: result.message,
                });
                if (result.success) router.refresh();
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: error instanceof Error ? error.message : 'An unexpected error occurred.',
                });
            }
        });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCharacter(character.id);
            toast({ title: 'Character Deleted', description: `${character.name} has been removed.` });
            router.push('/characters');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error instanceof Error ? error.message : 'Could not delete the character.',
            });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleTogglePublicStatus = () => {
        const newStatus = character.status === 'public' ? 'private' : 'public';
        handleUpdate(() => updateCharacterStatus(character.id, newStatus));
    };

    const handleToggleDataPackSharing = () => {
        const newSharingStatus = !character.isSharedToDataPack;
        handleUpdate(() => updateCharacterDataPackSharing(character.id, newSharingStatus));
    };
    
    const canBranch = currentUserId && !isOwner && character.branchingPermissions === 'public' && character.status === 'public';


    return (
        <div className="flex gap-2">
            {canBranch && <BranchButton characterId={character.id} isIcon />}

            {isOwner && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon"><Settings /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link href={`/characters/${character.id}/edit`}><Pencil className="mr-2" /> Edit Details</Link>
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger>
                                <Settings className="mr-2" /> Versioning & Perms
                           </DropdownMenuSubTrigger>
                           <DropdownMenuSubContent>
                                <VersionActions character={character} onUpdate={handleUpdate} />
                           </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        
                        <DropdownMenuSeparator />

                         <DropdownMenuItem onClick={handleTogglePublicStatus} disabled={isUpdating}>
                            {character.status === 'public' ? <ShieldOff className="mr-2"/> : <ShieldCheck className="mr-2"/>}
                            {character.status === 'public' ? "Make Private" : "Make Public"}
                        </DropdownMenuItem>
                         {character.dataPackId && (
                            <DropdownMenuItem onClick={handleToggleDataPackSharing} disabled={isUpdating}>
                                    <GalleryHorizontal className="mr-2"/>
                                    {character.isSharedToDataPack ? "Unshare from Gallery" : "Share to Gallery"}
                                </DropdownMenuItem>
                            )}
                        
                        <DropdownMenuSeparator />
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/20 focus:text-destructive">
                                    <Trash2 className="mr-2" /> Delete Character
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your character and remove their data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
