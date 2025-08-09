
'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getCharacters, deleteCharacter, updateCharacterStatus, updateCharacterDataPackSharing, createCharacterVersion, updateCharacterBranchingPermissions } from '../actions/characters';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/page-header';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Loader2, User, Swords, Pencil, Trash2, Copy, ShieldCheck, ShieldOff, Share2, GalleryHorizontal, Plus, GitBranch, Settings, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


function CharacterDetailPanel({ character, onCharacterDeleted, onCharacterUpdated, onBack }: { 
  character: Character | null; 
  onCharacterDeleted: (id: string) => void; 
  onCharacterUpdated: () => void;
  onBack: () => void; 
}) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, startUpdateTransition] = useTransition();
  
  if (!character) {
    return (
        <div className="w-full lg:w-3/4 flex-col gap-4 items-center justify-center h-full min-h-[600px] bg-card/30 rounded-lg border-2 border-dashed hidden lg:flex">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-center text-muted-foreground">Select a character from the list to see their details.</p>
        </div>
    );
  }

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(character.description);
    toast({
      title: 'Prompt Copied!',
      description: 'The original prompt has been copied to your clipboard.',
    });
  }, [character.description, toast]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteCharacter(character.id);
      toast({
        title: 'Character Deleted',
        description: `${character.name} has been removed.`,
      });
      onCharacterDeleted(character.id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'Could not delete the character.',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [character.id, character.name, toast, onCharacterDeleted]);
  
  const handleUpdate = useCallback((updateAction: () => Promise<any>) => {
    startUpdateTransition(async () => {
      try {
        const result = await updateAction();
        toast({
          title: result.success ? 'Success!' : 'Update Failed',
          description: result.message,
        });
        if (result.success) onCharacterUpdated();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    });
  }, [toast, onCharacterUpdated]);

  const handleTogglePublicStatus = () => {
    const newStatus = character.status === 'public' ? 'private' : 'public';
    handleUpdate(() => updateCharacterStatus(character.id, newStatus));
  };

  const handleToggleDataPackSharing = () => {
    const newSharingStatus = !character.isSharedToDataPack;
    handleUpdate(() => updateCharacterDataPackSharing(character.id, newSharingStatus));
  };
  
  const handleToggleBranchingPermissions = () => {
    const newPermissions = character.branchingPermissions === 'public' ? 'private' : 'public';
    handleUpdate(() => updateCharacterBranchingPermissions(character.id, newPermissions));
  }

  const handleCreateVersion = () => {
    handleUpdate(() => createCharacterVersion(character.id));
  };

  const isPublic = character.status === 'public';
  const wasMadeWithDataPack = !!character.dataPackId;
  const canBranch = character.branchingPermissions === 'public';
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={character.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full lg:w-3/4"
      >
        <Card className="h-full bg-card/50 border-0 shadow-none">
          <CardContent className="p-0">
            <div className="group relative aspect-square w-full rounded-t-lg overflow-hidden bg-muted/20">
                <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-4 left-4 z-10 lg:hidden">
                    <ArrowLeft />
                </Button>
                <Image
                    key={character.imageUrl}
                    src={character.imageUrl}
                    alt={character.name}
                    fill
                    className="object-contain"
                    priority
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
                 <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-white">
                    <h2 className="text-2xl sm:text-4xl font-extrabold font-headline tracking-wider drop-shadow-lg">{character.name}</h2>
                    <div className="flex items-center gap-4 text-base sm:text-lg text-primary-foreground/80 drop-shadow-md">
                      <p>{isPublic ? "Public Character" : "Private Character"}</p>
                      {wasMadeWithDataPack && character.isSharedToDataPack && (
                        <>
                          <span>•</span>
                          <p>Shared to Gallery</p>
                        </>
                      )}
                       {canBranch && isPublic && (
                        <>
                          <span>•</span>
                          <p>Branching Enabled</p>
                        </>
                      )}
                    </div>
                 </div>

                 <div className="absolute top-4 right-4">
                    <div className="flex gap-2 p-2 rounded-lg bg-black/40 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                      <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                  <Button variant="secondary" size="icon" asChild>
                                    <Link href={`/characters/${character.id}/edit`}><Pencil /></Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Character</p></TooltipContent>
                        </Tooltip>
                        
                        <AlertDialog>
                            <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={isDeleting}>
                                            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                                        </Button>
                                    </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Character</p></TooltipContent>
                            </Tooltip>
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
                          <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon"><Settings /></Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>More Actions</p></TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleCopyPrompt}>
                                    <Copy className="mr-2"/> Copy Original Prompt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleTogglePublicStatus} disabled={isUpdating}>
                                    {isPublic ? <ShieldOff className="mr-2"/> : <ShieldCheck className="mr-2"/>}
                                    {isPublic ? "Make Private" : "Make Public"}
                                </DropdownMenuItem>
                                {isPublic && (
                                <DropdownMenuItem onClick={handleToggleBranchingPermissions} disabled={isUpdating}>
                                        <GitBranch className="mr-2"/>
                                        {canBranch ? "Disable Branching" : "Enable Branching"}
                                    </DropdownMenuItem>
                                )}
                                {wasMadeWithDataPack && (
                                <DropdownMenuItem onClick={handleToggleDataPackSharing} disabled={isUpdating}>
                                        <GalleryHorizontal className="mr-2"/>
                                        {character.isSharedToDataPack ? "Unshare from Gallery" : "Share to Gallery"}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                      </TooltipProvider>
                    </div>
                 </div>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Biography</CardTitle>
                        <CardDescription>Created on {new Date(character.createdAt).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48 pr-4">
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap">{character.biography}</p>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Versions</CardTitle>
                        <CardDescription>Manage different versions of this character.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="icon" onClick={handleCreateVersion} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="animate-spin"/> : <Plus />}
                        </Button>
                        {character.versions?.sort((a,b) => b.version - a.version).map(v => (
                            <Button key={v.id} asChild variant={v.id === character.id ? 'default' : 'secondary'}>
                                <Link href={`/characters?id=${v.id}`}>
                                    {v.name}
                                </Link>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}


export default function CharactersPage() {
  const { authUser, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchCharacters = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const fetchedCharacters = await getCharacters();
      setCharacters(fetchedCharacters);

      const urlId = searchParams.get('id');
      if (urlId && fetchedCharacters.some(c => c.id === urlId)) {
        setSelectedCharacterId(urlId);
      } else if (fetchedCharacters.length > 0 && !selectedCharacterId) {
        setSelectedCharacterId(fetchedCharacters[0].id);
      } else if (fetchedCharacters.length === 0) {
        setSelectedCharacterId(null);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    } finally {
      setLoading(false);
    }
  }, [authUser, selectedCharacterId, searchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    fetchCharacters();
  }, [authUser, authLoading, router, fetchCharacters]);
  
  const handleCharacterDeleted = useCallback((deletedId: string) => {
    setCharacters(prev => {
        const remaining = prev.filter(c => c.id !== deletedId);
        if (selectedCharacterId === deletedId) {
            const newSelectedId = remaining.length > 0 ? remaining[0].id : null;
            setSelectedCharacterId(newSelectedId);
             if (newSelectedId) {
                router.push(`/characters?id=${newSelectedId}`, { scroll: false });
            } else {
                 router.push('/characters', { scroll: false });
            }
        }
        return remaining;
    });
  }, [selectedCharacterId, router]);

  const selectCharacter = (id: string) => {
    setSelectedCharacterId(id);
    router.push(`/characters?id=${id}`, { scroll: false });
  }
  
  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId) || null;
  }, [characters, selectedCharacterId]);

  const showDetailsMobile = selectedCharacterId && characters.length > 0;
  
  if (authLoading || (loading && characters.length === 0 && !authUser)) {
     return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
        <PageHeader 
            title="My Characters"
            description="Select a character from your collection to view their details."
        />
      
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          {loading && characters.length === 0 ? (
             <div className="w-full flex items-center justify-center p-8 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : characters.length > 0 ? (
              <>
                  <aside className={cn("w-full lg:w-1/4", showDetailsMobile && "hidden lg:block")}>
                      <ScrollArea className="h-full max-h-[40vh] lg:max-h-[70vh] pr-4">
                          <div className="space-y-2">
                              {characters.map(character => (
                                  <button
                                      key={character.id}
                                      onClick={() => selectCharacter(character.id)}
                                      className={cn(
                                          "w-full text-left p-2 rounded-lg border-2 border-transparent transition-all duration-200 hover:bg-card/80",
                                          selectedCharacterId === character.id && "bg-card border-primary shadow-md"
                                      )}
                                  >
                                      <div className="flex items-center gap-4">
                                          <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted/20">
                                              <Image src={character.imageUrl} alt={character.name} fill className="object-contain" />
                                          </div>
                                          <div>
                                              <p className="font-semibold text-card-foreground">{character.name}</p>
                                              <p className="text-xs text-muted-foreground">{character.versionName}</p>
                                          </div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </ScrollArea>
                  </aside>
                  
                  <div className={cn("w-full lg:w-3/4", !showDetailsMobile && "hidden lg:block")}>
                    <CharacterDetailPanel 
                        character={selectedCharacter} 
                        onCharacterDeleted={handleCharacterDeleted}
                        onCharacterUpdated={fetchCharacters}
                        onBack={() => setSelectedCharacterId(null)}
                    />
                  </div>
              </>
          ) : (
              <div className="col-span-full w-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                  <User className="h-16 w-16 mb-4 text-primary/70" />
                  <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">Your Gallery is Empty</h2>
                  <p className="max-w-xs mx-auto mb-6">It looks like you haven't forged any characters yet. Let's bring your first legend to life!</p>
                  <Link href="/character-generator" className={cn(buttonVariants({ size: 'lg' }), "bg-accent text-accent-foreground hover:bg-accent/90")}>
                      <Swords className="mr-2 h-5 w-5" />
                      Forge a New Character
                  </Link>
              </div>
          )}
      </div>
    </div>
  );
}
