
'use server';

import { getPublishedArticles } from '@/app/actions/articles';
import { BackButton } from '@/components/back-button';
import { ArticleCard } from '@/components/article/article-card';
import { Newspaper } from 'lucide-react';
import type { ArticleWithCover } from '@/components/article/article-card';

const extractCoverImage = (content: string): string | null => {
    const match = content.match(/\!\[.*?\]\((.*?)\)/);
    return match ? match[1] : null;
};

export default async function ArticlesPage() {
    const articles = await getPublishedArticles();

    const articlesWithCovers: ArticleWithCover[] = articles.map(article => ({
        ...article,
        coverImageUrl: extractCoverImage(article.content),
    }));

    return (
        <div className="container py-8">
            <div className="max-w-4xl mx-auto">
                <BackButton title="Articles" description="Tips and guides for getting the most out of CharaForge." />

                <div className="mt-8 space-y-8">
                    {articlesWithCovers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {articlesWithCovers.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                            <Newspaper className="mx-auto h-12 w-12 mb-4 text-primary/70" />
                            <p>No articles have been published yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
