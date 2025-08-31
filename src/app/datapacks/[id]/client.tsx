
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { installDataPack, getPublicDataPack, getCreationsForDataPack } from '@/app/actions/datapacks';
import { Download, ShoppingCart, Loader2, Check, User, ArrowRight, Swords } from 'lucide-react';
import type { DataPack } from '@/types/datapack';
import type { Character } from '@/types/character';
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSlotCategory } from '@/lib/app-config';
import { CharacterCard } from '@/components/character/character-card';
import { SectionTitle } from '@/components/section-title';

function DataPackInstallButton({ pack }: { pack: DataPack }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const { authUser, userProfile } = useAuth();

    const installedPacks = userProfile?.preferences?.installed_packs || [];
    const isInstalled = installedPacks.includes(pack.id);

    const handleInstall = () => {
        if (!authUser) {
            router.push('/login');
            return;
        }

        startTransition(async () => {
            const result = await installDataPack(pack.id);
            toast({
                title: result.success ? 'Success!' : 'Error',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                router.refresh();
            }
        });
    };
    
    const handlePurchase = () => {
        if (!authUser) {
            router.push('/login');
            return;
        }
        toast({
            title: 'Coming Soon!',
            description: 'The marketplace for premium packs is under construction.',
        });
    };
    
    if (isInstalled) {
        return (
             <Button className="w-full md:w-auto" size="lg" variant="secondary" disabled>
                <Check className="mr-2 h-4 w-4" />
                <span>Installed</span>
            </Button>
        )
    }

    if (pack.type === 'premium') {
         return (
             <Button onClick={handlePurchase} className="w-full md:w-auto" disabled={isPending} size="lg">
                <ShoppingCart className="mr-2" /> Purchase for ${pack.price}
            </Button>
        )
    }

    return (
        <Button onClick={handleInstall} className="w-full md:w-auto" disabled={isPending} size="lg">
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Install for Free
        </Button>
    )
}


export function DataPackDetailClient({ packId }: { packId: string }) {
    const [pack, setPack] = useState<DataPack | null>(null);
    const [creations, setCreations] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [packData, creationsData] = await Promise.all([
                    getPublicDataPack(packId),
                    getCreationsForDataPack(packId)
                ]);
                setPack(packData);
                setCreations(creationsData as Character[]);
            } catch (error) {
                console.error("Failed to fetch datapack details", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [packId]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!pack) {
        return <div className="text-center py-12">DataPack not found.</div>;
    }

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        e.preventDefault();
        e.stopPropagation();
        // Maybe navigate to search page in the future
    }
    
    return (
        <div className="container py-12">
            <div className="grid lg:grid-cols-3 gap-12 items-start max-w-7xl mx-auto">
                <div className="lg:col-span-1 space-y-6">
                    <BackButton />
                    <Card className="sticky top-24">
                        <CardHeader className="p-0">
                            <div className="relative aspect-square">
                                <Image
                                    src={pack.coverImageUrl || 'https://placehold.co/600x600.png'}
                                    alt={pack.name}
                                    fill
                                    className="object-cover rounded-t-lg"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h1 className="text-3xl font-bold font-headline">{pack.name}</h1>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                             <CardDescription className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4" /> 
                                <span>by @{pack.author}</span>
                            </CardDescription>
                            <p className="text-sm text-muted-foreground">{pack.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {pack.tags.map(tag => (
                                    <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`} onClick={(e) => handleTagClick(e, tag)}>
                                        <Badge variant="outline" data-category={getSlotCategory(tag)} className="cursor-pointer hover:border-primary/50">{tag}</Badge>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <DataPackInstallButton pack={pack} />
                        </CardFooter>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Schema Preview</CardTitle>
                            <CardDescription>A look at the options available in this pack.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-96 overflow-y-auto bg-muted/50 p-4 rounded-md text-sm custom-scroll">
                                <pre><code>{JSON.stringify(pack.schema, null, 2)}</code></pre>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {creations.length > 0 && (
                        <div>
                             <SectionTitle title="Community Creations" subtitle="Creations from the community using this DataPack." />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {creations.map(creation => (
                                    <CharacterCard key={creation.id} character={creation} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
