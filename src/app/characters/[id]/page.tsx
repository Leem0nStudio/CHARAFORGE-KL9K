
'use server';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import { User, Calendar, Tag, GitBranch, Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { BranchButton } from './branch-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { EditButton } from './edit-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BackButton } from '@/components/back-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

async function getCharacter(characterId: string): Promise<{ character: Character | null, currentUserId: string | null }> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return { character: null, currentUserId: null };
    }
    
    let currentUserId: string | null = null;
    try {
        const cookieStore = cookies();
        const idToken = cookieStore.get('firebaseIdToken')?.value;
        if (idToken) {
            const decodedToken = await adminDb.app.auth().verifyIdToken(idToken);
            currentUserId = decodedToken.uid;
        }
    } catch (e) {
      // Ignore error if user is not logged in
    }


    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const doc = await characterRef.get();

        if (!doc.exists) {
            return { character: null, currentUserId };
        }

        const data = doc.data();
        if (!data) return { character: null, currentUserId };
        
        // Fetch user, datapack, and branchedFrom info in parallel
        const [userDoc, dataPackDoc, originalAuthorDoc] = await Promise.all([
            data.userId ? adminDb.collection('users').doc(data.userId).get() : Promise.resolve(null),
            data.dataPackId ? adminDb.collection('datapacks').doc(data.dataPackId).get() : Promise.resolve(null),
            data.originalAuthorId ? adminDb.collection('users').doc(data.originalAuthorId).get() : Promise.resolve(null),
        ]);
        
        const userName = userDoc && userDoc.exists ? userDoc.data()?.displayName || 'Anonymous' : 'Anonymous';
        const originalAuthorName = originalAuthorDoc && originalAuthorDoc.exists ? originalAuthorDoc.data()?.displayName || 'Anonymous' : data.originalAuthorName || null;
        const dataPackName = dataPackDoc && dataPackDoc.exists ? dataPackDoc.data()?.name || null : null;

        const character: Character = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
            originalAuthorName: originalAuthorName,
            dataPackName: dataPackName,
            branchingPermissions: data.branchingPermissions || 'private',
        } as Character;

        return { character, currentUserId };

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return { character: null, currentUserId };
    }
}

export default async function CharacterDetailPage({ params }: { params: { id: string } }) {
    const { character, currentUserId } = await getCharacter(params.id);

    if (!character) {
        notFound();
    }
    
    const isOwner = character.userId === currentUserId;

    if (character.status !== 'public' && !isOwner) {
        notFound();
    }

    const canBranch = currentUserId && !isOwner && character.branchingPermissions === 'public';

    return (
        <div className="container py-8 max-w-7xl mx-auto">
             <div className="flex items-center gap-4 mb-4">
                <BackButton />
                <h1 className="text-3xl font-bold tracking-tight font-headline sr-only">{character.name}</h1>
            </div>
            
            <Card className="w-full p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column: Character Details */}
                  <div className="w-full">
                      <Card className="bg-card/50 overflow-hidden h-full flex flex-col">
                          {/* Header Section */}
                          <div className="p-4 bg-info-card-header text-info-card-header-foreground">
                              <h2 className="text-4xl font-headline tracking-wider">{character.name}</h2>
                          </div>
                          
                          {/* Metadata Section */}
                          <div className="p-4 border-b border-border">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-1.5">
                                      <User className="h-4 w-4" />
                                      <span>{character.userName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" />
                                      <span>{new Date(character.createdAt).toLocaleDateString()}</span>
                                  </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                  {character.dataPackId && character.dataPackName && (
                                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                                          <Tag className="h-3 w-3 mr-1.5" />
                                          <Link href={`/datapacks/${character.dataPackId}`} className="hover:underline">
                                          {character.dataPackName}
                                          </Link>
                                      </Badge>
                                  )}
                                  {character.branchedFromId && (
                                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                                          <GitBranch className="h-3 w-3 mr-1.5" />
                                          Branched
                                      </Badge>
                                  )}
                                  {character.originalAuthorName && character.branchedFromId && (
                                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                                          <User className="h-3 w-3 mr-1.5" />
                                          Origin: {character.originalAuthorName}
                                      </Badge>
                                  )}
                              </div>
                          </div>
                          
                          {/* Biography Section */}
                          <CardContent className="pt-6 flex-1 flex flex-col">
                              <ScrollArea className="flex-grow h-96">
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed pr-4">
                                    {character.biography}
                                </p>
                              </ScrollArea>
                          </CardContent>
                      </Card>
                  </div>

                  {/* Right Column: Character Image */}
                  <div className="w-full">
                       <Card className="overflow-hidden group relative border-2 border-primary/20 shadow-lg">
                           <Dialog>
                              <DialogTrigger asChild>
                                  <div className="w-full aspect-square relative bg-muted/20 cursor-pointer">
                                      <Image
                                          src={character.imageUrl}
                                          alt={character.name}
                                          fill
                                          priority
                                          className="object-contain p-2"
                                      />
                                  </div>
                               </DialogTrigger>
                               <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
                                  <Image
                                    src={character.imageUrl}
                                    alt={character.name}
                                    width={1024}
                                    height={1024}
                                    className="object-contain rounded-lg w-full h-auto"
                                  />
                                </DialogContent>
                            </Dialog>

                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                           <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <TooltipProvider>
                                  {isOwner && <EditButton characterId={character.id} />}
                                  {canBranch && <BranchButton characterId={character.id} isIcon={true} />}
                                   <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="secondary" size="icon" disabled>
                                              <Heart />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Like (Coming Soon)</p></TooltipContent>
                                  </Tooltip>
                                   <Tooltip>
                                      <TooltipTrigger asChild>
                                           <Button variant="secondary" size="icon" disabled>
                                              <MessageSquare />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Comment (Coming Soon)</p></TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                          </div>
                       </Card>
                  </div>
              </div>
            </Card>
        </div>
    );
}
