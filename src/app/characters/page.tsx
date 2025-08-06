
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getCharactersWithSignedUrls, deleteCharacter, updateCharacterStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoginButton } from '@/components/login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackButton } from '@/components/back-button';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Bot, Loader2, User, Swords, Pencil, Trash2, Copy, ShieldCheck, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


function CharacterDetailPanel({ character, onCharacterDeleted, onCharacterUpdated }: { character: Character; onCharacterDeleted: (id: string) => void; onCharacterUpdated: () => void; }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
  
  const handleToggleStatus = useCallback(async () => {
    setIsUpdatingStatus(true);
    const newStatus = character.status === 'public' ? 'private' : 'public';
    try {
      await updateCharacterStatus(character.id, newStatus);
      toast({
        title: `Character Updated!`,
        description: `${character.name} is now ${newStatus}.`,
      });
      onCharacterUpdated();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update the character status.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [character.id, character.name, character.status, toast, onCharacterUpdated]);

  const isPublic = character.status === 'public';
  
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
            <div className="relative aspect-[16/9] w-full rounded-t-lg overflow-hidden">
                <Image
                    src={character.imageUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                    priority
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                 <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-4xl font-extrabold font-headline tracking-wider drop-shadow-lg">{character.name}</h2>
                    <p className="text-lg text-primary-foreground/80 drop-shadow-md">{isPublic ? "Public Character" : "Private Character"}</p>
                 </div>
                 <div className="absolute top-4 right-4 flex gap-2">
                    <Button variant="secondary" size="icon" asChild>
                        <Link href={`/characters/${character.id}/edit`}><Pencil /></Link>
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        </Button>
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
                 </div>
            </div>
            <div className="p-6 space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleCopyPrompt}><Copy /> Copy Original Prompt</Button>
                    <Button onClick={handleToggleStatus} disabled={isUpdatingStatus}>
                        {isUpdatingStatus ? <Loader2 className="animate-spin" /> : (isPublic ? <ShieldOff /> : <ShieldCheck />)}
                        {isPublic ? "Make Private" : "Make Public"}
                    </Button>
                </div>
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

  const fetchCharacters = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const fetchedCharacters = await getCharactersWithSignedUrls();
      setCharacters(fetchedCharacters);
      if (fetchedCharacters.length > 0 && !selectedCharacterId) {
        setSelectedCharacterId(fetchedCharacters[0].id);
      } else if (fetchedCharacters.length === 0) {
        setSelectedCharacterId(null);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    } finally {
      setLoading(false);
    }
  }, [authUser, selectedCharacterId]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    fetchCharacters();
  }, [authUser, authLoading, router, fetchCharacters]);
  
  const handleCharacterDeleted = useCallback((deletedId: string) => {
    const remainingCharacters = characters.filter(c => c.id !== deletedId);
    setCharacters(remainingCharacters);
    if (selectedCharacterId === deletedId) {
        setSelectedCharacterId(remainingCharacters.length > 0 ? remainingCharacters[0].id : null);
    }
  }, [characters, selectedCharacterId]);
  
  const selectedCharacter = useMemo(() => {
    return characters.find(c => c.id === selectedCharacterId);
  }, [characters, selectedCharacterId]);
  
  if (authLoading || (loading && characters.length === 0)) {
     return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
       <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
         <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <Link href="/" className="flex items-center gap-2">
                <Bot className="h-6 w-6 mr-2 text-primary" />
                 <div className="font-bold font-headline text-2xl tracking-wider">
                    <span className="text-foreground">Chara</span><span className="bg-gradient-to-t from-accent from-70% to-yellow-600/80 bg-clip-text text-transparent">Forge</span>
                </div>
            </Link>
           <div className="flex flex-1 items-center justify-end space-x-4">
             <nav className="flex items-center space-x-1">
               <LoginButton />
               <ThemeToggle />
             </nav>
           </div>
         </div>
       </header>
       <main className="flex-1 container py-8">
        <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
           <div className="flex items-center gap-4">
              <BackButton />
              <div className='flex flex-col'>
                <h1 className="text-3xl font-semibold font-headline tracking-wider">My Characters</h1>
                <p className="text-muted-foreground">Select a character from your collection to view their details.</p>
              </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
            {characters.length > 0 ? (
                <>
                    <aside className="w-full lg:w-1/4">
                        <ScrollArea className="h-full max-h-[70vh] pr-4">
                            <div className="space-y-2">
                                {characters.map(character => (
                                    <button
                                        key={character.id}
                                        onClick={() => setSelectedCharacterId(character.id)}
                                        className={cn(
                                            "w-full text-left p-2 rounded-lg border-2 border-transparent transition-all duration-200 hover:bg-card/80",
                                            selectedCharacterId === character.id && "bg-card border-primary shadow-md"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                                                <Image src={character.imageUrl} alt={character.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-card-foreground">{character.name}</p>
                                                <p className="text-xs text-muted-foreground">{character.status === 'public' ? "Public" : "Private"}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </aside>
                    
                    {selectedCharacter ? (
                        <CharacterDetailPanel 
                           character={selectedCharacter} 
                           onCharacterDeleted={handleCharacterDeleted}
                           onCharacterUpdated={fetchCharacters}
                        />
                    ) : (
                         <div className="w-full lg:w-3/4 flex items-center justify-center">
                            <p className="text-muted-foreground">Select a character to see details.</p>
                         </div>
                    )}
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
      </main>
    </div>
  );
}
