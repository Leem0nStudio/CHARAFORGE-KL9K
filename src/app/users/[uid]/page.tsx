
'use server';

import { notFound } from 'next/navigation';
import { getPublicUserProfile, getFollowStatus } from '@/app/actions/user';
import { getPublicCharactersForUser } from '@/app/actions/creations';

import { verifyAndGetUid } from '@/lib/auth/server'; // Will be replaced by Supabase equivalent
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Heart } from 'lucide-react';
import { CharacterCard } from '@/components/character/character-card';
import { FollowButton } from '@/components/user/follow-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function UserProfilePage({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = await params;
    const [userProfile, userCreations] = await Promise.all([
        getPublicUserProfile(uid),
        getPublicCharactersForUser(uid),
    ]);

    if (!userProfile) {
        notFound();
    }
    
    let isFollowing = false;
    let currentUserId: string | null = null;
    try {
        const supabase = (await import('@/lib/supabase/server')).getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id || null;

        if (currentUserId) {
            const status = await getFollowStatus(uid);
            isFollowing = status.isFollowing;
        }
    } catch (e) {
        // User not logged in, which is fine
    }

    const isOwner = currentUserId === uid;

    const fallback = userProfile.displayName?.charAt(0) || '?';

    return (
        <div className="container py-8">
            <BackButton />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 items-start">
                {/* Left Sidebar */}
                <div className="md:col-span-1 lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader className="items-center text-center">
                             <Avatar className="h-24 w-24 text-4xl border-2 border-primary mb-2">
                                <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User Avatar'} />
                                <AvatarFallback>{fallback}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl font-headline">{userProfile.displayName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <FollowButton 
                                    currentUserId={currentUserId}
                                    profileUserId={uid}
                                    isFollowingInitially={isFollowing}
                                />
                                <div className="flex justify-around text-center pt-4 border-t">
                                    <div>
                                        <p className="text-2xl font-bold">{userProfile.stats?.followers || 0}</p>
                                        <p className="text-xs text-muted-foreground">Followers</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{userProfile.stats?.following || 0}</p>
                                        <p className="text-xs text-muted-foreground">Following</p>
                                    </div>
                                </div>
                                <div className="flex justify-around text-center pt-4 border-t">
                                    <div className="flex flex-col items-center">
                                        <Swords className="text-primary"/>
                                        <p className="font-bold">{userProfile.stats?.charactersCreated || 0}</p>
                                        <p className="text-xs text-muted-foreground">Creations</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Heart className="text-destructive"/>
                                        <p className="font-bold">{userProfile.stats?.totalLikes || 0}</p>
                                        <p className="text-xs text-muted-foreground">Likes</p>
                                    </div>
                                </div>
                                {/* About Me Section */}
                                {userProfile.bio && (
                                    <div className="pt-4 border-t">
                                        <h3 className="font-semibold text-muted-foreground mb-2">About Me</h3>
                                        <p className="text-sm text-card-foreground/90 whitespace-pre-wrap">{userProfile.bio}</p>
                                    </div>
                                )}
                                {isOwner && (
                                    <div className="pt-4 border-t">
                                         <Button variant="outline" className="w-full" asChild>
                                            <Link href="/profile">Edit Profile</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Content */}
                <div className="md:col-span-3 lg:col-span-4">
                    {/* Featured Creations Section */}
                    {userProfile.profile?.featuredCharacters && userProfile.profile.featuredCharacters.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-headline mb-4">Featured Creations</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {userProfile.profile.featuredCharacters.map(charId => {
                                    const featuredChar = userCreations.find(c => c.id === charId);
                                    return featuredChar ? <CharacterCard key={featuredChar.id} character={featuredChar} /> : null;
                                })}
                            </div>
                            {isOwner && (
                                <div className="mt-4">
                                    <Button variant="outline" asChild>
                                        <Link href="/profile">Edit Featured</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                    <h2 className="text-2xl font-headline mb-4">Public Creations</h2>
                     {userCreations.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {userCreations.map(creation => (
                                <CharacterCard key={creation.id} character={creation} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg bg-card/50">
                            <p>This creator hasn't published any characters yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
