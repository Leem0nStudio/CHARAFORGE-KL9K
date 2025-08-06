
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Expand, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Character } from '@/types/character';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type HomePageClientProps = {
    featuredCreations: Character[];
}

export function HomePageClient({ featuredCreations }: HomePageClientProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  return (
    <>
        <section id="gallery" className="container py-8 md:py-12">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12">
            <h1 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">Explore Creations</h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Discover a universe of characters crafted by the CharaForge community. Click on any creation to see its story.
            </p>
          </div>
          {featuredCreations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {featuredCreations.map((creation) => (
                <motion.div 
                    key={creation.id} 
                    layoutId={`character-card-${creation.id}`}
                    whileHover={{ y: -5, scale: 1.02 }} 
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => setSelectedCharacter(creation)}
                    className="cursor-pointer"
                >
                    <Card className="overflow-hidden group h-full flex flex-col">
                        <div className="relative w-full aspect-square">
                            <Image
                                src={creation.imageUrl}
                                alt={creation.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                                <p className="text-white text-sm font-bold truncate w-full">{creation.name}</p>
                            </div>
                        </div>
                        <CardContent className="p-3 bg-card/80 mt-auto">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src="https://placehold.co/100x100.png" alt={`@${creation.userName}`} data-ai-hint="user avatar" />
                                    <AvatarFallback>{creation.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <p className="text-xs text-muted-foreground truncate">@{creation.userName}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                ))}
            </div>
            ) : (
               <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                  <User className="h-16 w-16 mb-4 text-primary/70" />
                  <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">No Public Characters Yet</h2>
                  <p className="max-w-xs mx-auto mb-6">The gallery is waiting for its first hero. Be the one to forge a public character!</p>
              </div>
            )}
        </section>

        <AnimatePresence>
            {selectedCharacter && (
              <AlertDialog open onOpenChange={() => setSelectedCharacter(null)}>
                  <AlertDialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col md:flex-row p-0 gap-0">
                      <AlertDialogHeader className="sr-only">
                        <AlertDialogTitle>{selectedCharacter.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Viewing details for the character {selectedCharacter.name}, created by @{selectedCharacter.userName}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                     <div className="w-full md:w-1/2 h-64 md:h-auto aspect-square md:aspect-auto relative">
                        <Image src={selectedCharacter.imageUrl} alt={selectedCharacter.name} fill className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none" />
                         <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10" onClick={() => setSelectedCharacter(null)}>
                            <X className="w-5 h-5"/>
                            <span className="sr-only">Close</span>
                         </Button>
                     </div>
                     <div className="w-full md:w-1/2 flex flex-col p-6 overflow-hidden">
                        <div className='flex items-center gap-4 mb-4'>
                           <Avatar>
                              <AvatarImage src="https://placehold.co/100x100.png" alt={`@${selectedCharacter.userName}`} data-ai-hint="user avatar" />
                              <AvatarFallback>{selectedCharacter.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                           </Avatar>
                           <div className="flex-grow">
                              <p className="font-bold">@{selectedCharacter.userName}</p>
                              <p className="text-sm text-muted-foreground">Creator</p>
                           </div>
                           <Button variant="outline" asChild>
                             <Link href={`/characters/${selectedCharacter.id}/edit`}>Edit</Link>
                           </Button>
                        </div>
                        <Separator />
                        <div className="flex-grow mt-4 overflow-hidden flex flex-col">
                          <h3 className="text-2xl font-bold font-headline tracking-wider mb-2">{selectedCharacter.name}</h3>
                          <ScrollArea className="flex-grow pr-4 -mr-4">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedCharacter.biography}</p>
                          </ScrollArea>
                        </div>
                     </div>
                  </AlertDialogContent>
              </AlertDialog>
            )}
        </AnimatePresence>
    </>
  );
}
