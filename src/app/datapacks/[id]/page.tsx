
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getDataPack } from '../actions';
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
  const pack = await getDataPack(id);

  if (!pack) {
    notFound();
  }

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
    </div>
  );
}

    