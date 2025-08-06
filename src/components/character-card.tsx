
'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Copy, Trash2, Loader2, Pencil, ShieldCheck, ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteCharacter, updateCharacterStatus } from '@/app/characters/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import type { Character } from '@/types/character';
import { ScrollArea } from './ui/scroll-area';

type CharacterCardProps = {
  character: Character;
  onCharacterDeleted: () => void;
};

function CharacterCardComponent({ character, onCharacterDeleted }: CharacterCardProps) {
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
        description: `${character.name} has been removed from your gallery.`,
      });
      onCharacterDeleted();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'Could not delete the character. Please try again.',
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
      router.refresh(); 
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update the character. Please try again.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [character.id, character.name, character.status, toast, router]);

  const isPublic = character.status === 'public';
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <AnimatePresence>
      <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout>
        <Card className="flex flex-col md:flex-row group w-full overflow-hidden min-h-[450px]">
          {/* Left Side: Image */}
          <div className="md:w-2/5 w-full relative">
            <div className="aspect-square w-full h-full">
              {character.imageUrl ? (
                <Image
                    src={character.imageUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                    priority={false}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No Image</p>
                </div>
              )}
            </div>
             {/* Floating Action Buttons */}
             <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button variant="secondary" size="icon" asChild>
                      <Link href={`/characters/${character.id}/edit`}>
                          <Pencil />
                          <span className="sr-only">Edit</span>
                      </Link>
                  </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                            <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your character
                          and remove their data from our servers.
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
             {isPublic && (
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full shadow-lg flex items-center gap-1">
                <ShieldCheck className="w-3 h-3"/>
                PUBLIC
                </div>
            )}
          </div>
          
          {/* Right Side: Content */}
          <div className="md:w-3/5 w-full flex flex-col p-6">
            <CardHeader className="p-0">
               <CardTitle className="font-headline text-4xl mb-2">{character.name}</CardTitle>
               <CardDescription>Created on {new Date(character.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4 flex-grow flex flex-col">
              <h4 className="font-headline text-lg mb-2 flex items-center gap-2 text-muted-foreground"><BookOpen/> Biography</h4>
              <div className="flex-grow relative">
                <ScrollArea className="absolute inset-0 pr-4">
                  <p className="text-sm space-y-4 text-muted-foreground">
                      {character.biography}
                  </p>
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="p-0 mt-6 flex flex-col items-start gap-4">
               <Button variant="ghost" size="sm" onClick={handleCopyPrompt}>
                  <Copy className="mr-2" />
                  Copy Original Prompt
                </Button>
              <Button 
                  variant={isPublic ? "secondary" : "default"} 
                  className="w-full" 
                  onClick={handleToggleStatus} 
                  disabled={isUpdatingStatus}
              >
                  {isUpdatingStatus ? <Loader2 className="animate-spin mr-2" /> : (isPublic ? <ShieldOff className="mr-2"/> : <ShieldCheck className="mr-2"/>)}
                  {isPublic ? 'Make Private' : 'Make Public'}
              </Button>
            </CardFooter>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export const CharacterCard = memo(CharacterCardComponent);
