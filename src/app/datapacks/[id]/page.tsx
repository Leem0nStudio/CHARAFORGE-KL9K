
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getCreationsForDataPack, getPublicDataPacks } from '@/app/actions/datapacks';
import { User, GalleryVertical, Package, GitBranch } from 'lucide-react';
import { DataPackClient } from './client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Character } from '@/types/character';


interface DataPackDetailPageProps {
  params: {
    id: string;
  };
}

// Helper function to get a single pack from the full list
async function getDataPack(packId: string) {
    const allPacks = await getPublicDataPacks();
    return allPacks.find(p => p.id === packId) || null;
}

const CreationCard = ({ creation }: { creation: Character }) => {
    const isBranch = !!creation.branchedFromId;

    return (
        <Card className="overflow-hidden group relative h-full flex flex-col border-2 border-transparent hover:border-primary transition-colors duration-300">
            <div className="aspect-square relative w-full bg-muted/20">
                <Link href={`/characters/${creation.id}`}>
                    <Image
                        src={creation.imageUrl}
                        alt={creation.name}
                        fill
                        className="object-contain w-full transition-transform duration-300 group-hover:scale-105"
                    />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2">
                            {isBranch && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <GitBranch className="h-3 w-3" />
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Branched</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <h3 className="font-bold text-lg leading-tight drop-shadow-md truncate">{creation.name}</h3>
                    </div>
                </Link>
            </div>
            <CardFooter className="p-3 bg-card flex-col items-start flex-grow">
                    <div className="w-full">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>by {creation.userName}</span>
                    </div>
                    {isBranch && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                            <GitBranch className="h-3 w-3" />
                            <span>from {creation.originalAuthorName || 'Unknown'}</span>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}


export default async function DataPackDetailPage({ params }: DataPackDetailPageProps) {
  const { id } = params;
  const pack = await getDataPack(id);

  if (!pack) {
    notFound();
  }

  const communityCreations = await getCreationsForDataPack(id);

  return (
    <div className="container py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                 <Image
                    src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                    alt={pack.name}
                    width={600}
                    height={400}
                    className="w-full rounded-lg shadow-lg object-contain"
                    data-ai-hint="datapack cover image"
                />
            </div>
            <div className="md:w-2/3">
                <h1 className="text-4xl font-bold tracking-tight font-headline">{pack.name}</h1>
                <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
                    <User className="h-5 w-5" /> 
                    <span>by @{pack.author}</span>
                </p>
                <p className="mt-4 text-base text-muted-foreground">{pack.description}</p>
                 <DataPackClient pack={pack} />
            </div>
        </div>
        
        {/* Community Creations Section */}
        <div>
           <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                    <GalleryVertical className="text-primary" />
                    Community Creations
                </CardTitle>
                <CardDescription>Creations from the community using this DataPack.</CardDescription>
             </CardHeader>
             <CardContent>
                {communityCreations.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {communityCreations.map(creation => (
                            <CreationCard key={creation.id} creation={creation} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p className="mb-2 font-semibold">Be the First!</p>
                        <p>No creations have been shared for this DataPack yet.</p>
                    </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

    