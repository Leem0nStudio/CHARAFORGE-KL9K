

import { notFound } from 'next/navigation';
import { getCreationsForDataPack, getPublicDataPack } from '@/app/actions/datapacks';
import { User, GalleryVertical, Package, Quote } from 'lucide-react';
import { DataPackClient } from './client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CharacterCard } from '@/components/character/character-card';
import { SectionTitle } from '@/components/section-title';
import Image from 'next/image';
import Link from 'next/link';
import { getSlotCategory } from '@/lib/app-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';


interface DataPackDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DataPackDetailPage({ params }: DataPackDetailPageProps) {
  const pack = await getPublicDataPack(params.id);

  if (!pack) {
    notFound();
  }

  const communityCreations = await getCreationsForDataPack(pack.id);

  return (
    <div className="container py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 relative">
                 <Image
                    src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                    alt={pack.name}
                    width={600}
                    height={400}
                    className="w-full rounded-lg shadow-lg object-cover aspect-[3/4]"
                    data-ai-hint="datapack cover image"
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            </div>
            <div className="w-full md:w-2/3">
                <h1 className="text-4xl font-bold tracking-tight font-headline">{pack.name}</h1>
                <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
                    <User className="h-5 w-5" /> 
                    <span>by @{pack.author}</span>
                </p>
                 <div className="flex flex-wrap gap-2 mt-4">
                    {pack.tags.map((tag) => (
                        <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
                            <Badge 
                                variant="outline"
                                className="cursor-pointer hover:border-primary/50"
                                data-category={getSlotCategory(tag)}
                            >
                                {tag}
                            </Badge>
                        </Link>
                    ))}
                </div>
                <p className="mt-4 text-base text-card-foreground/80">{pack.description}</p>
                <div className="mt-6 flex items-center gap-4">
                     <Button asChild className="w-full md:w-auto" size="lg">
                        <Link href={`/character-generator?packId=${pack.id}`}>
                            <Wand2 className="mr-2" /> Use this DataPack
                        </Link>
                    </Button>
                    <DataPackClient pack={pack} />
                </div>
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            {/* Prompt Template Section */}
             <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Quote className="text-primary" />
                        Prompt Template
                    </CardTitle>
                    <CardDescription>This is the underlying template used to generate characters.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground font-mono break-words">
                        {pack.schema.promptTemplate}
                    </div>
                 </CardContent>
            </Card>

            {/* Slots Section */}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Package className="text-primary" />
                        Wizard Slots
                    </CardTitle>
                    <CardDescription>The building blocks available in the generation wizard.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="flex flex-wrap gap-2">
                         {pack.schema.slots.map((slot) => (
                            <Badge 
                                key={slot.id} 
                                variant="outline"
                                data-category={getSlotCategory(slot.id)}
                            >
                                {slot.label}
                            </Badge>
                        ))}
                    </div>
                 </CardContent>
            </Card>
        </div>

        {/* Community Creations Section */}
        {communityCreations.length > 0 && (
            <div className="w-full">
                <SectionTitle 
                    title="Community Creations"
                    subtitle="Creations from the community using this DataPack."
                />
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {communityCreations.map(creation => (
                        <CharacterCard key={creation.id} character={creation} />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
