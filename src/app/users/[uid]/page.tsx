
import { notFound } from 'next/navigation';
import { getPublicUserProfile } from '@/app/actions/user';
import { getPublicCharactersForUser } from '@/app/actions/creations';
import { BackButton } from '@/components/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Heart } from 'lucide-react';
import { CharacterCard } from '@/components/character/character-card';


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
            <BackButton 
                title={userProfile.displayName || 'Public Profile'}
                description="Explore the gallery of this creator."
            />
            
            <div className="max-w-7xl mx-auto">
                <Card className="mb-8 bg-card/50">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 text-4xl border-2 border-primary">
                            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || 'User Avatar'} />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-bold">{userProfile.displayName}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Swords className="h-4 w-4" />
                                    <span>{userProfile.stats?.charactersCreated || 0} creations</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Heart className="h-4 w-4" />
                                    <span>{userProfile.stats?.totalLikes || 0} likes</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <h3 className="text-2xl font-headline mb-4">Public Creations</h3>
                {userCreations.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {userCreations.map(creation => (
                            <CharacterCard key={creation.id} character={creation} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                        <p>This creator hasn't published any characters yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
