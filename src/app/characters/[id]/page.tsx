
'use server';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import { User, Calendar, Tag, GitBranch, Shield, ScrollText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BackButton } from '@/components/back-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/types/user';
import { CharacterImageActions } from '@/components/character/character-image-actions';


async function getCharacter(characterId: string): Promise<{
    character: Character | null,
    currentUserId: string | null,
    creatorProfile: UserProfile | null,
    originalAuthorProfile: UserProfile | null
}> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return { character: null, currentUserId: null, creatorProfile: null, originalAuthorProfile: null };
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
            return { character: null, currentUserId: null, creatorProfile: null, originalAuthorProfile: null };
        }

        const data = doc.data();
        if (!data) return { character: null, currentUserId: null, creatorProfile: null, originalAuthorProfile: null };
        
        // Fetch user, datapack, and original author profile in parallel
        const [userDoc, dataPackDoc, originalAuthorDoc] = await Promise.all([
            data.userId ? adminDb.collection('users').doc(data.userId).get() : Promise.resolve(null),
            data.dataPackId ? adminDb.collection('datapacks').doc(data.dataPackId).get() : Promise.resolve(null),
            data.originalAuthorId ? adminDb.collection('users').doc(data.originalAuthorId).get() : Promise.resolve(null),
        ]);
        
        const creatorProfile = userDoc && userDoc.exists ? userDoc.data() as UserProfile : null;
        
        const originalAuthorProfile = originalAuthorDoc && originalAuthorDoc.exists ? originalAuthorDoc.data() as UserProfile : null;
        const originalAuthorName = originalAuthorProfile?.displayName || data.originalAuthorName || null;
        
        const dataPackName = dataPackDoc && dataPackDoc.exists ? dataPackDoc.data()?.name || null : null;

        const character: Character = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: creatorProfile?.displayName || 'Anonymous', // Use fetched profile name
            originalAuthorName: originalAuthorName,
            dataPackName: dataPackName,
            branchingPermissions: data.branchingPermissions || 'private',
            versions: data.versions || [{ id: doc.id, name: data.versionName || 'v.1', version: data.version || 1 }],
            alignment: data.alignment || 'True Neutral',
            tags: data.tags || [],
            isNsfw: data.isNsfw || false,
        } as Character;

        return { character, currentUserId, creatorProfile, originalAuthorProfile };

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return { character: null, currentUserId: null, creatorProfile: null, originalAuthorProfile: null };
    }
}


export default async function CharacterDetailPage({ params }: { params: { id: string } }) {
    const { character, currentUserId, creatorProfile, originalAuthorProfile } = await getCharacter(params.id);

    if (!character) {
        notFound();
    }
    
    const isOwner = character.userId === currentUserId;

    if (character.status !== 'public' && !isOwner) {
        notFound();
    }
    
    const authorForAvatar = creatorProfile || { displayName: character.userName || '?', photoURL: null };

    return (
        <div className="container py-8 max-w-7xl mx-auto">
             <div className="flex items-center gap-4 mb-4">
                <BackButton />
                <h1 className="text-3xl font-bold tracking-tight font-headline sr-only">{character.name}</h1>
            </div>
            
            <Card className="w-full p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column: Character Image */}
                  <div className="w-full lg:sticky lg:top-20">
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
                                  <DialogTitle className="sr-only">{character.name}</DialogTitle>
                                  <DialogDescription className="sr-only">{character.description}</DialogDescription>
                                  <Image
                                    src={character.imageUrl}
                                    alt={character.name}
                                    width={1024}
                                    height={1024}
                                    className="object-contain rounded-lg w-full h-auto"
                                  />
                                </DialogContent>
                            </Dialog>

                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                           <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/30 backdrop-blur-sm p-2 rounded-lg">
                              <CharacterImageActions 
                                character={character}
                                currentUserId={currentUserId}
                                isOwner={isOwner}
                              />
                          </div>
                       </Card>
                  </div>

                  {/* Right Column: Character Details */}
                  <div className="w-full">
                      <Card className="bg-card/50 overflow-hidden h-full flex flex-col">
                          {/* Header Section */}
                          <div className="p-4 bg-info-card-header text-info-card-header-foreground flex items-center gap-4">
                              <Avatar className="h-10 w-10 border-2 border-info-card-header-foreground/50">
                                <AvatarImage src={authorForAvatar.photoURL || undefined} alt={authorForAvatar.displayName || 'Author'} />
                                <AvatarFallback>{authorForAvatar.displayName?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <h2 className="text-4xl font-headline tracking-wider">{character.name}</h2>
                          </div>
                          
                          {/* Metadata Section */}
                          <div className="p-4 border-b border-t border-border space-y-3">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                      <User className="h-3 w-3" />
                                      <span>{character.userName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(character.createdAt).toLocaleDateString()}</span>
                                  </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">
                                      <Shield className="h-3 w-3 mr-1.5" />
                                      {character.alignment}
                                  </Badge>
                                   {character.isNsfw && (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1.5" />
                                      NSFW
                                    </Badge>
                                  )}
                                  {character.branchedFromId && originalAuthorProfile && (
                                      <Badge variant="secondary">
                                          <GitBranch className="h-3 w-3 mr-1.5" />
                                          Branched from {originalAuthorProfile.displayName || 'Unknown'}
                                      </Badge>
                                  )}
                                  {character.dataPackId && character.dataPackName && (
                                     <Link href={`/datapacks/${character.dataPackId}`}>
                                        <Badge variant="secondary" className="hover:bg-accent/20 transition-colors">
                                           <Tag className="h-3 w-3 mr-1.5" />
                                            {character.dataPackName}
                                        </Badge>
                                      </Link>
                                  )}
                              </div>

                               {character.tags && character.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                  {character.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </div>
                          
                          {/* Biography & Timeline Section */}
                          <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
                              <ScrollArea className="flex-grow h-[600px] pr-4">
                                <div>
                                    <h3 className="text-xl font-headline mb-2 flex items-center gap-2"><ScrollText className="w-5 h-5 text-primary" /> Biography</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {character.biography}
                                    </p>
                                </div>
                              </ScrollArea>
                          </CardContent>
                      </Card>
                  </div>

              </div>
            </Card>
        </div>
    );
}

    