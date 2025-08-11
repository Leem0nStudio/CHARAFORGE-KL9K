
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User, AlertTriangle, ArrowRight, Tag } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DataPack } from '@/types/datapack';
import { chartColors } from '@/lib/app-config';

interface DataPackCardProps {
    pack: DataPack;
}

export function DataPackCard({ pack }: DataPackCardProps) {
    return (
         <Card key={pack.id} className="flex flex-col overflow-hidden group hover:shadow-primary/20 transition-all duration-300 h-full">
           <Link href={`/datapacks/${pack.id}`} className="flex flex-col h-full">
                <CardHeader className="p-0">
                    <div className="relative aspect-square bg-muted/20">
                        <Image
                            src={pack.coverImageUrl || 'https://placehold.co/600x600.png'}
                            alt={pack.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain transition-transform duration-300 group-hover:scale-105 p-2"
                            data-ai-hint="datapack cover image"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                            {pack.isNsfw && <Badge variant="destructive" className="font-bold"><AlertTriangle className="w-3 h-3 mr-1"/>NSFW</Badge>}
                            <Badge className={cn(
                                "font-bold",
                                pack.type === 'premium' && "bg-yellow-500 text-black",
                                pack.type === 'free' && "bg-green-500",
                                pack.type === 'temporal' && "bg-blue-500"
                            )}>{pack.type}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardTitle className="font-bold">{pack.name}</CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                        <User className="h-4 w-4" /> 
                        <span>by @{pack.author}</span>
                    </CardDescription>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{pack.description}</p>
                     {pack.tags && pack.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-3">
                            {pack.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                                key={tag} 
                                variant="outline"
                                className={cn(chartColors[index % chartColors.length])}
                            >
                                {tag.replace(/_/g, ' ')}
                            </Badge>
                            ))}
                            {pack.tags.length > 3 && <Badge variant="outline">...</Badge>}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="mt-auto p-4">
                   <p className="text-sm text-primary font-semibold group-hover:underline">View Details <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1" /></p>
                </CardFooter>
           </Link>
        </Card>
    );
}
