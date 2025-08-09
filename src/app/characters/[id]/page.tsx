
'use server';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import { User, Calendar, Tag, GitBranch, ChevronsRight, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { BranchButton } from './branch-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { EditButton } from './edit-button';


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
        
        let branchedFrom: { id: string, name: string } | null = null;

        // Fetch user, datapack, and branchedFrom info in parallel
        const [userDoc, dataPackDoc, branchedFromDoc, originalAuthorDoc] = await Promise.all([
            data.userId ? adminDb.collection('users').doc(data.userId).get() : Promise.resolve(null),
            data.dataPackId ? adminDb.collection('datapacks').doc(data.dataPackId).get() : Promise.resolve(null),
            data.branchedFromId ? adminDb.collection('characters').doc(data.branchedFromId).get() : Promise.resolve(null),
            data.originalAuthorId ? adminDb.collection('users').doc(data.originalAuthorId).get() : Promise.resolve(null),
        ]);
        
        const userName = userDoc && userDoc.exists ? userDoc.data()?.displayName || 'Anonymous' : 'Anonymous';
        const originalAuthorName = originalAuthorDoc && originalAuthorDoc.exists ? originalAuthorDoc.data()?.displayName || 'Anonymous' : data.originalAuthorName || null;
        const dataPackName = dataPackDoc && dataPackDoc.exists ? dataPackDoc.data()?.name || null : null;
        if (branchedFromDoc && branchedFromDoc.exists) {
            branchedFrom = { id: branchedFromDoc.id, name: branchedFromDoc.data()?.name || 'Unknown' };
        }

        const character: Character = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
            originalAuthorName: originalAuthorName,
            dataPackName: dataPackName,
            branchingPermissions: data.branchingPermissions || 'private',
        } as Character;
        
        // This is a bit awkward, but we add the branchedFrom data after casting
        // to avoid type conflicts with the core Character type definition.
        (character as any).branchedFrom = branchedFrom;


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

    // Character must be public to be viewed, unless the viewer is the owner.
    if (character.status !== 'public' && !isOwner) {
        notFound();
    }

    const canBranch = currentUserId && !isOwner && character.branchingPermissions === 'public';
    const branchedFrom = (character as any).branchedFrom;

    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-6">
                <Card className="overflow-hidden group relative">
                     <div className="w-full aspect-[4/3] relative bg-muted/20">
                        <Image
                            src={character.imageUrl}
                            alt={character.name}
                            fill
                            priority
                            className="object-contain"
                        />
                         <div className="absolute top-4 right-4">
                            <div className="flex gap-2 p-2 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <TooltipProvider>
                                    {isOwner && <EditButton characterId={character.id} />}
                                    {canBranch && <BranchButton characterId={character.id} isIcon={true} />}
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h1 className="font-headline text-3xl">{character.name}</h1>
                         
                         <div className="text-sm text-muted-foreground space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Created by {character.userName}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Created on {new Date(character.createdAt).toLocaleDateString()}</span>
                            </div>
                            {character.dataPackId && character.dataPackName && (
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    <span>
                                        From:{' '}
                                        <Link href={`/datapacks/${character.dataPackId}`} className="hover:underline text-primary">
                                            {character.dataPackName}
                                        </Link>
                                    </span>
                                </div>
                            )}
                        </div>

                         {branchedFrom && (
                            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-2 border-l-4 border-primary">
                                <div className="flex items-center gap-2">
                                  <GitBranch className="h-4 w-4 text-primary" />
                                  <span>Branched from{' '}
                                    <Link href={`/characters/${branchedFrom.id}`} className="font-semibold text-foreground hover:underline">
                                       {branchedFrom.name}
                                    </Link>
                                  </span>
                                </div>
                                {character.originalAuthorName && 
                                    <div className="flex items-center gap-2 pl-6">
                                        <ChevronsRight className="h-4 w-4"/>
                                        <span>Original creator:{' '}
                                            <span className="font-semibold text-foreground">{character.originalAuthorName}</span>
                                        </span>
                                    </div>
                                }
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Biography</CardTitle>
                         <CardDescription>The story of {character.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                        {character.biography}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

