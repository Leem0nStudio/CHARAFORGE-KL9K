
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default async function DataPacksPage() {
    const dataPacks = await getPublicDataPacks();

    return (
        <div className="container py-8">
            <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">DataPacks Catalog</h1>
                    <p className="text-muted-foreground">
                        Browse and select a DataPack to start creating with the Prompt Wizard.
                    </p>
                </div>
            </div>

            {dataPacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {dataPacks.map(pack => (
                        <Card key={pack.id} className="flex flex-col overflow-hidden group hover:shadow-primary/20 transition-all duration-300 h-full">
                           <Link href={`/datapacks/${pack.id}`} className="flex flex-col h-full">
                                <CardHeader className="p-0">
                                    <div className="relative aspect-square bg-muted/20">
                                        <Image
                                            src={pack.coverImageUrl || 'https://placehold.co/600x600.png'}
                                            alt={pack.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-contain transition-transform duration-300 group-hover:scale-105"
                                            data-ai-hint="datapack cover image"
                                        />
                                        <Badge className={cn(
                                            "absolute top-2 right-2 font-bold",
                                            pack.type === 'premium' && "bg-yellow-500 text-black",
                                            pack.type === 'free' && "bg-green-500",
                                            pack.type === 'temporal' && "bg-blue-500"
                                        )}>{pack.type}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="font-bold">{pack.name}</CardTitle>
                                    <CardDescription className="mt-2 flex items-center gap-2">
                                        <User className="h-4 w-4" /> 
                                        <span>by @{pack.author}</span>
                                    </CardDescription>
                                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{pack.description}</p>
                                </CardContent>
                                <CardFooter className="mt-auto p-4">
                                   <p className="text-sm text-primary font-semibold">View Details →</p>
                                </CardFooter>
                           </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50 max-w-7xl mx-auto">
                    <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">No DataPacks Found</h2>
                    <p className="max-w-xs mx-auto">It seems there are no DataPacks available at the moment. Please check back later or run the seeding script.</p>
                </div>
            )}
        </div>
    );
}
