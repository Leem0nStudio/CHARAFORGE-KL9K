
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardFooter } from '@/components/ui/card';
import type { Article } from '@/types/article';
import { ArrowRight, User, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';

export interface ArticleWithCover extends Article {
    coverImageUrl: string | null;
}

export function ArticleCard({ article }: { article: ArticleWithCover }) {
    const isSystemArticle = article.author === 'CharaForge';

    return (
        <Link href={`/articles/${article.slug}`} className="block h-full group">
            <motion.div
                whileHover={{
                    scale: 1.02,
                    rotateZ: 0.5,
                    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(255, 255, 255, 0.2)",
                    transition: { duration: 0.2, ease: "easeOut" }
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
            >
                <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary/50 bg-card/70">
                    <div className="relative aspect-video bg-muted">
                        <Image
                            src={article.coverImageUrl || 'https://placehold.co/1600x900.png'}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <CardFooter className="p-4 flex-col items-start bg-card-highlight flex-grow">
                         <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                         <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground w-full">
                           {isSystemArticle ? (
                                <Badge variant="secondary" className="border-primary/50">
                                    <ShieldCheck className="h-4 w-4 mr-1 text-primary" />
                                    Official Guide
                                </Badge>
                            ) : (
                                <div className="flex items-center gap-2">
                                     <User className="h-4 w-4" /> 
                                    <span>by {article.author}</span>
                                </div>
                            )}
                            <span className="mx-1">•</span>
                            <span>{format(new Date(article.createdAt), 'PPP')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2 flex-grow">{article.excerpt}</p>
                        <span className="text-sm text-primary font-semibold flex items-center mt-auto pt-2">
                            Read More <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1 ml-1" />
                        </span>
                    </CardFooter>
                </Card>
            </motion.div>
        </Link>
    );
}
