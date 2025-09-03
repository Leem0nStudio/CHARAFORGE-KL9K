
// This component will display a single DataPack as a card in the marketplace listing.

import React from 'react';
import Link from 'next/link';
import type { DataPack } from '@/types/datapack';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatapackCardProps {
  datapack: DataPack;
}

const DatapackCard: React.FC<DatapackCardProps> = ({ datapack }) => {
  return (
    <Link href={`/datapacks/${datapack.id}`} className="block border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-card/70 hover:border-primary/50">
        <CardHeader className="p-0">
            <div className="relative aspect-video bg-muted">
                <Image 
                    src={datapack.coverImageUrl || 'https://placehold.co/1600x900.png'} 
                    alt={datapack.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <CardTitle className="group-hover:text-primary transition-colors">{datapack.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4" /> 
                <span>by @{datapack.author}</span>
            </CardDescription>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{datapack.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
            <div>
                 <Badge className={cn(
                    "font-bold",
                    datapack.type === 'premium' && "bg-yellow-500 text-black",
                    datapack.type === 'free' && "bg-green-500",
                    datapack.type === 'temporal' && "bg-blue-500"
                )}>{datapack.price === 0 ? 'Free' : `$${datapack.price}`}</Badge>
            </div>
            <span className="text-sm text-primary font-semibold flex items-center">
                View <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1 ml-1" />
            </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export { DatapackCard };
