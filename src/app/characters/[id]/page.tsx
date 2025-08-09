
'use server';

import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import { User, Calendar, Tag, GitBranch, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { branchCharacter } from '@/app/actions/characters';
import { BranchButton } from './branch-button';


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

        let userName = 'Anonymous';
        let dataPackName = null;
        let branchedFrom: { id: string, name: string } | null = null;

        // Fetch user, datapack, and branchedFrom info in parallel
        const [userDoc, dataPackDoc, branchedFromDoc] = await Promise.all([
            data.userId ? adminDb.collection('users').doc(data.userId).get() : Promise.resolve(null),
            data.dataPackId ? adminDb.collection('datapacks').doc(data.dataPackId).get() : Promise.resolve(null),
            data.branchedFromId ? adminDb.collection('characters').doc(data.branchedFromId).get() : Promise.resolve(null),
        ]);

        if (userDoc && userDoc.exists) {
            userName = userDoc.data()?.displayName || 'Anonymous';
        }
        if (dataPackDoc && dataPackDoc.exists) {
            dataPackName = dataPackDoc.data()?.name || null;
        }
        if (branchedFromDoc && branchedFromDoc.exists) {
            branchedFrom = { id: branchedFromDoc.id, name: branchedFromDoc.data()?.name || 'Unknown' };
        }

        const character: Character = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
            dataPackName: dataPackName,
            branchingPermissions: data.branchingPermissions || 'private', // FIX: Added this line
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
        <div className="container py-8">
            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                         <CardHeader className="p-0">
                            <div className="w-full aspect-square relative bg-muted/20">
                                <Image
                                    src={character.imageUrl}
                                    alt={character.name}
                                    fill
                                    className="object-contain rounded-t-lg"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {branchedFrom && (
                                <div className="mb-4 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <GitBranch className="h-4 w-4 text-primary" />
                                      <span>Branched from{' '}
                                        <Link href={`/characters/${branchedFrom.id}`} className="font-semibold text-foreground hover:underline">
                                           {branchedFrom.name}
                                        </Link>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <ChevronsRight className="h-3 w-3"/>
                                        <span>Original creator:{' '}
                                            <span className="font-semibold text-foreground">{character.originalAuthorName || 'Unknown'}</span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <h2 className="text-2xl font-bold font-headline">{character.name}</h2>
                             <div className="text-sm text-muted-foreground space-y-2 mt-2">
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
                             {canBranch && (
                                <div className="mt-4">
                                   <BranchButton characterId={character.id} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
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
        </div>
    );
}
