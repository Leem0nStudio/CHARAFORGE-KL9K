
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getDataPack, getCreationsForDataPack } from '../actions';
import { Button } from '@/components/ui/button';
import { Wand2, Download, Check, User, GalleryVertical } from 'lucide-react';
import { DataPackClient } from './client';
import { Card } from '@/components/ui/card';

interface DataPackDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DataPackDetailPage({ params }: DataPackDetailPageProps) {
  const { id } = params;
  const packData = await getDataPack(id);

  if (!packData) {
    notFound();
  }
  
  const creations = await getCreationsForDataPack(id);
  const { pack, schema } = packData;

  return (
    <div className="container py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                 <Image
                    src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                    alt={pack.name}
                    width={600}
                    height={400}
                    className="w-full rounded-lg shadow-lg object-cover"
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
      </div>

       <div className="max-w-7xl mx-auto mt-12">
            <h2 className="text-3xl font-headline font-semibold mb-6 flex items-center gap-3">
                <GalleryVertical className="w-8 h-8 text-primary" />
                Community Creations
            </h2>
            {creations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {creations.map(character => (
                        <Card key={character.id} className="overflow-hidden group relative">
                            <Image
                                src={character.imageUrl}
                                alt={character.name}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                             <div className="absolute bottom-0 left-0 p-4 text-white">
                                <h3 className="font-bold truncate">{character.name}</h3>
                                <p className="text-xs text-muted-foreground">by @{character.userName}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[200px] border-2 border-dashed rounded-lg bg-card/50">
                    <h3 className="text-xl font-medium font-headline tracking-wider mb-2">Be the First!</h3>
                    <p className="max-w-xs mx-auto">No creations have been shared for this DataPack yet. Use the wizard to create something amazing and share it with the community.</p>
                </div>
            )}
       </div>
    </div>
  );
}

    