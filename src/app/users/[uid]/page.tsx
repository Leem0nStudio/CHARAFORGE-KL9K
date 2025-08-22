
'use server';

import { notFound } from 'next/navigation';
import { getPublicUserProfile } from '@/app/actions/user';
import { getPublicCharactersForUser } from '@/app/actions/creations';
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Heart } from 'lucide-react';
import { GachaCard } from '@/components/character/gacha-card';


export default async function UserProfilePage({ params }: { params: { uid: string } }) {
    const [userProfile, userCreations] = await Promise.all([
        getPublicUserProfile(params.uid),
        getPublicCharactersForUser(params.uid),
    ]);

    if (!userProfile) {
        notFound();
    }
    
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
                             <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-2xl font-bold">{userProfile.stats?.charactersCreated || 0}</p>
                                    <p className="text-xs text-muted-foreground">Creations</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{userProfile.stats?.totalLikes || 0}</p>
                                    <p className="text-xs text-muted-foreground">Likes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Content */}
                <div className="md:col-span-3 lg:col-span-4">
                    <h2 className="text-2xl font-headline mb-4">Public Creations</h2>
                     {userCreations.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {userCreations.map(creation => (
                                <GachaCard key={creation.id} character={creation} />
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
