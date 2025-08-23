
import { getPublishedArticles } from '@/app/actions/articles';
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';
import { User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ArticlesPage() {
    const articles = await getPublishedArticles();

    return (
        <div className="container py-8">
            <div className="max-w-3xl mx-auto">
                <BackButton title="Articles" description="Tips and guides for getting the most out of CharaForge." />

                <div className="mt-8 space-y-8">
                    {articles.length > 0 ? (
                        articles.map((article) => (
                           <Card key={article.id} className="group hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <Link href={`/articles/${article.slug}`}>
                                        <CardTitle className="group-hover:text-primary transition-colors">{article.title}</CardTitle>
                                    </Link>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                        <User className="h-4 w-4" /> 
                                        <span>Published on {format(new Date(article.createdAt), 'PPP')} by {article.author}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground line-clamp-3">{article.excerpt}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="link" className="p-0 h-auto">
                                        <Link href={`/articles/${article.slug}`}>
                                            Read More <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                            <p>No articles have been published yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
