
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DataPack } from '@/types/datapack';
import { getSlotCategory } from '@/lib/app-config';
import { motion } from 'framer-motion';

interface DataPackCardProps {
    pack: DataPack;
    isCompact?: boolean;
    onClick?: (pack: DataPack) => void;
}

export function DataPackCard({ pack, isCompact = false, onClick }: DataPackCardProps) {
    const router = useRouter();
    
    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        // Prevent click from bubbling up to the parent card/link
        e.stopPropagation();
        e.preventDefault(); 
        // Navigate programmatically
        router.push(`/search?tag=${encodeURIComponent(tag)}`);
    }

    const cardContent = (
        <motion.div
            className="h-full"
            whileHover={{
                scale: 1.03,
                rotateX: onClick ? 0 : 5,
                rotateY: onClick ? 0 : -5,
                boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5), 0px 0px 15px rgba(128, 0, 128, 0.4)",
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ perspective: 1000 }}
        >
            <Card className="flex flex-col overflow-hidden group transition-all duration-300 h-full bg-gradient-to-br from-card-highlight to-card-highlight/80 border-primary/30 hover:border-primary/70 relative z-10">
                <CardHeader className="p-0">
                    <div className="relative aspect-square bg-muted/20 block">
                        <Image
                            src={pack.coverImageUrl || 'https://placehold.co/600x600.png'}
                            alt={pack.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint="datapack cover image"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                        <div className="absolute top-2 right-2 flex gap-1">
                            {pack.isNsfw && <Badge variant="destructive">NSFW</Badge>}
                            <Badge className={cn(
                                "font-bold",
                                pack.type === 'premium' && "bg-yellow-500 text-black",
                                pack.type === 'free' && "bg-green-500",
                                pack.type === 'temporal' && "bg-blue-500"
                            )}>{pack.type}</Badge>
                        </div>
                         <div className="absolute bottom-0 left-0 right-0 p-4">
                            <CardTitle className="text-white font-bold drop-shadow-lg font-headline text-lg sm:text-xl">{pack.name}</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardDescription className="flex items-center gap-2">
                        <User className="h-4 w-4" /> 
                        <span>by @{pack.author}</span>
                    </CardDescription>
                    {!isCompact && (
                        <>
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{pack.description}</p>
                            {pack.tags && pack.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pt-3">
                                    {pack.tags.slice(0, 3).map((tag) => (
                                        <button key={tag} onClick={(e) => handleTagClick(e, tag)} className="focus:outline-none">
                                            <Badge 
                                                variant="outline"
                                                className="cursor-pointer hover:border-primary/50"
                                                data-category={getSlotCategory(tag)}
                                            >
                                                {tag}
                                            </Badge>
                                        </button>
                                    ))}
                                    {pack.tags.length > 3 && <Badge variant="outline">...</Badge>}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
                {!isCompact && !onClick && (
                     <CardFooter className="mt-auto p-4 bg-card">
                        <span className="text-sm text-primary font-semibold group-hover:underline flex items-center">
                            View Details <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1 ml-1" />
                        </span>
                    </CardFooter>
                )}
            </Card>
        </motion.div>
    );

    if (onClick) {
        return (
            <button onClick={() => onClick(pack)} className="w-full h-full text-left">
                {cardContent}
            </button>
        )
    }

    return (
         <Link href={`/datapacks/${pack.id}`} className="block h-full group">
            {cardContent}
         </Link>
    )
}
