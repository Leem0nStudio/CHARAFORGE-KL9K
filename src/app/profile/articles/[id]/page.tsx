
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getArticle } from '@/app/actions/articles';
import { ArticleForm, type Article } from './article-form';
import { BackButton } from '@/components/back-button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

function EditArticlePageContent() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';
    
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [error, setError] = useState<string | null>(null);
    const { authUser } = useAuth();
    
    useEffect(() => {
        if (!isNew && authUser) {
            getArticle(id)
                .then(data => {
                    if (data && data.userId === authUser.id) {
                        setArticle(data);
                    } else if (data) {
                        setError("You do not have permission to edit this article.");
                    } else {
                        setError("Article not found.");
                    }
                })
                .catch(() => setError("Failed to fetch article."))
                .finally(() => setIsLoading(false));
        }
    }, [id, isNew, authUser]);

    const title = isNew ? 'Create New Article' : `Edit: ${article?.title || 'Article'}`;

    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <BackButton title={title} description="Share your knowledge and stories with the community." />
            <div className="mt-8">
                {isLoading ? (
                    <div className="flex justify-center items-center p-16">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : error ? (
                    <p className="text-destructive text-center">{error}</p>
                ) : (
                    <ArticleForm article={article} />
                )}
            </div>
        </div>
    );
}


export default function EditArticlePage() {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    }>
      <EditArticlePageContent />
    </Suspense>
  );
}
