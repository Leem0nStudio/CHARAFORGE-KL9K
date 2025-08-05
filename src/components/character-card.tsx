
'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Copy, Send, Trash2, Loader2, Pencil, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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


type CharacterCardProps = {
  character: Character;
};

function CharacterCardComponent({ character }: CharacterCardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

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
      router.refresh();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'Could not delete the character. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [character.id, character.name, toast, router]);

  const handleToggleStatus = useCallback(async () => {
    setIsPosting(true);
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
      setIsPosting(false);
    }
  }, [character.id, character.name, character.status, toast, router]);

  const isPosted = character.status === 'public';

  return (
    <Card className="flex flex-col group">
      <CardHeader className="p-0 relative">
        <div className="aspect-square w-full overflow-hidden rounded-t-lg">
            {character.imageUrl ? (
            <Image
                src={character.imageUrl}
                alt={character.name}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No Image</p>
            </div>
            )}
        </div>
        {isPosted && (
           <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold py-1 px-3 rounded-full shadow-lg flex items-center gap-1">
            <ShieldCheck className="w-3 h-3"/>
            PUBLIC
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-2xl mb-2">{character.name}</CardTitle>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" /> Biography
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm space-y-3 py-2">
              {character.biography
                .split('\n')
                .filter((p) => p.trim() !== '')
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Separator className="my-4" />
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Copy className="h-4 w-4" /> Original Prompt
            </h4>
            <Button variant="ghost" size="sm" onClick={handleCopyPrompt}>
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground italic p-3 bg-secondary/30 rounded-md">
            &quot;{character.description}&quot;
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex flex-col gap-2">
          <div className='flex w-full gap-2'>
             <Button variant={isPosted ? "secondary" : "default"} className="w-full" onClick={handleToggleStatus} disabled={isPosting}>
                {isPosting ? <Loader2 className="animate-spin" /> : <Send />}
                {isPosted ? 'Make Private' : 'Post Publicly'}
            </Button>
            <Button variant="outline" className="w-full" asChild>
                <Link href={`/characters/${character.id}/edit`}>
                    <Pencil />
                    Edit
                </Link>
            </Button>
          </div>
          <AlertDialog>
              <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  Delete
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
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                  </AlertDialogAction>
              </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export const CharacterCard = memo(CharacterCardComponent);
