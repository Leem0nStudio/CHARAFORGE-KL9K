
import { getPublishedArticles } from '@/app/actions/articles';
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function ArticlesPage() {
    const articles = await getPublishedArticles();

    return (
        <div className="container py-8">
            <div className="max-w-3xl mx-auto">
                <BackButton title="Articles" description="Tips and guides for getting the most out of CharaForge." />

                <div className="mt-8 space-y-8">
                    {articles.length > 0 ? (
                        articles.map((article) => (
                            <Link key={article.id} href={`/articles/${article.slug}`}>
                                <Card className="hover:border-primary/50 transition-colors">
                                    <CardHeader>
                                        <CardTitle>{article.title}</CardTitle>
                                        <CardDescription>
                                            Published on {format(new Date(article.createdAt), 'PPP')} by {article.author}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground line-clamp-2">{article.excerpt}</p>
                                    </CardContent>
                                </Card>
                            </Link>
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
