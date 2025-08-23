
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { Article } from '@/types/article';
import { ArrowRight, User } from 'lucide-react';

export interface ArticleWithCover extends Article {
    coverImageUrl: string | null;
}

export function ArticleCard({ article }: { article: ArticleWithCover }) {
    return (
        <Link href={`/articles/${article.slug}`} className="block h-full group">
            <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
                {article.coverImageUrl && (
                    <div className="relative aspect-video bg-muted">
                        <Image
                            src={article.coverImageUrl}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{article.title}</CardTitle>
                     <CardDescription className="flex items-center gap-2 pt-1 text-xs">
                        <User className="h-4 w-4" /> 
                        <span>by {article.author} on {format(new Date(article.createdAt), 'PPP')}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
                </CardContent>
                 <CardFooter>
                    <span className="text-sm text-primary font-semibold flex items-center">
                        Read More <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1 ml-1" />
                    </span>
                </CardFooter>
            </Card>
        </Link>
    );
}
