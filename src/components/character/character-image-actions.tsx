

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { deleteCharacter } from '@/app/actions/character-write';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Settings, Pencil, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { Character } from '@/types/character';
import { BranchButton } from './branch-button';


interface CharacterImageActionsProps {
    character: Character;
    currentUserId: string | null;
    isOwner: boolean;
}

export function CharacterImageActions({ character, currentUserId, isOwner }: CharacterImageActionsProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, startDeleteTransition] = useTransition();
    
    const handleDelete = async () => {
        startDeleteTransition(async () => {
            try {
                await deleteCharacter(character.id);
                toast({ title: 'Character Deleted', description: `${character.core.name} has been removed.` });
                router.push('/characters');
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Deletion Failed',
                    description: error instanceof Error ? error.message : 'Could not delete the character.',
                });
            }
        });
    };
    
    const canBranch = currentUserId && !isOwner && character.settings.branchingPermissions === 'public' && character.meta.status === 'public';


    return (
        <TooltipProvider>
            <div className="flex gap-2">
                {canBranch && <BranchButton characterId={character.id} isIcon />}

                {isOwner && (
                    <>
                        <Link href={`/characters/${character.id}/edit`}>
                            <Button>
                                <Pencil className="mr-2" /> Edit Character
                            </Button>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="secondary" size="icon"><Settings /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>More Actions</p></TooltipContent>
                                </Tooltip>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onSelect={() => router.push(`/characters/${character.id}/edit?tab=sharing`)}>
                                    <Settings className="mr-2" /> Sharing & Permissions
                                </DropdownMenuItem>
                                
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
                                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive-hover">
                                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}
