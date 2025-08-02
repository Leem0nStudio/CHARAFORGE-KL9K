'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Copy, Send, Trash2, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
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

export type Character = {
  id: string;
  name: string;
  description: string;
  biography: string;
  imageUrl: string;
  userId: string;
  status: 'private' | 'public';
  createdAt: Date;
};

type CharacterCardProps = {
  character: Character;
};

export function CharacterCard({ character }: CharacterCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isClientSide, setIsClientSide] = useState(false);

  // Avoid hydration errors with a client-side check
  useState(() => {
    setIsClientSide(true);
  }, []);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(character.description);
    toast({
      title: 'Prompt Copied!',
      description: 'The original prompt has been copied to your clipboard.',
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCharacter(character.id);
      toast({
        title: 'Character Deleted',
        description: `${character.name} has been removed from your gallery.`,
      });
      // The page will revalidate and remove the card
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Could not delete the character. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePost = async () => {
    setIsPosting(true);
    try {
      await updateCharacterStatus(character.id, 'public');
       toast({
        title: 'Character Posted!',
        description: `${character.name} is now public.`,
      });
      // The page will revalidate and update the card status
    } catch (error) {
       console.error('Error posting character:', error);
      toast({
        variant: 'destructive',
        title: 'Post Failed',
        description: 'Could not post the character. Please try again.',
      });
    } finally {
      setIsPosting(false);
    }
  }

  const isPosted = character.status === 'public';

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0 relative">
        <Image
          src={character.imageUrl}
          alt={character.name}
          width={400}
          height={400}
          className="w-full h-auto aspect-square object-cover rounded-t-lg"
        />
        {isPosted && (
           <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold py-1 px-3 rounded-full">
            POSTED
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
          <p className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md">
            &quot;{character.description}&quot;
          </p>
        </div>
      </CardContent>
      {isClientSide && (
        <CardFooter className="p-4 flex gap-2">
          <Button variant="outline" className="w-full" onClick={handlePost} disabled={isPosting || isPosted}>
            {isPosting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isPosted ? 'Posted' : 'Post to Feed'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
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
      )}
    </Card>
  );
}
