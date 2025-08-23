
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { Article } from '@/types/article';
import { ArrowRight, User } from 'lucide-react';

export function ArticleCard({ article }: { article: Article }) {
    return (
        <Link href={`/articles/${article.slug}`} className="block h-full">
            <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">{article.title}</CardTitle>
                     <CardDescription className="flex items-center gap-2">
                        <User className="h-4 w-4" /> 
                        <span>by {article.author} on {format(new Date(article.createdAt), 'PPP')}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-muted-foreground line-clamp-3">{article.excerpt}</p>
                </CardContent>
                 <CardFooter>
                    <span className="text-sm text-primary font-semibold group-hover:underline flex items-center">
                        Read More <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1 ml-1" />
                    </span>
                </CardFooter>
            </Card>
        </Link>
    );
}
