
'use server';
import 'server-only';
import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/app/actions/articles';
import { getComments } from '@/app/actions/comments';
import { format } from 'date-fns';
import Image from 'next/image';
import { CommentSection } from '@/components/comments/comment-section';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/back-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicUserProfile } from '@/app/actions/user';
import type { AsyncParams } from '@/types/next';

// This is a basic Markdown-to-HTML parser.
// For a production app, a more robust library like 'marked' or 'react-markdown' would be better.
function SimpleMarkdown({ content }: { content: string }) {
    // Remove the first image from the content as it's now the cover
    const contentWithoutCover = content.replace(/!\[.*?\]\(.*?\)/, '');
    const html = contentWithoutCover
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 border-b pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-10 mb-6 border-b pb-4">$1</h1>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">$1</code>')
        .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
        .split('\n')
        .map(line => {
            if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<code')) {
                return line;
            }
            if (line.trim() === '') return '';
            return `<p>${line}</p>`;
        })
        .join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-4" />;
}

const extractCoverImage = (content: string): string | null => {
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    return match ? match[1] : null;
};

export default async function ArticlePage({ params }: AsyncParams<{ slug: string }>) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    const [initialComments, authorProfile] = await Promise.all([
        getComments('article', article.id),
        getPublicUserProfile(article.userId)
    ]);

    const coverImage = extractCoverImage(article.content);
    const authorFallback = authorProfile?.displayName?.charAt(0) || article.author.charAt(0) || '?';

    return (
        <div className="container py-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <BackButton />
                </div>
                <article className="bg-card rounded-lg overflow-hidden shadow-lg">
                    {coverImage && (
                        <div className="relative h-64 w-full">
                            <Image
                                src={coverImage}
                                alt={article.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <h1 className="absolute bottom-4 left-4 text-3xl font-bold font-headline tracking-tight text-white">
                                {article.title}
                            </h1>
                        </div>
                    )}
                    <div className="p-6">
                        {!coverImage && (
                             <h1 className="text-4xl font-bold font-headline tracking-tight mb-4">{article.title}</h1>
                        )}
                        <div className="flex items-center gap-3 mb-6">
                            <Avatar>
                                <AvatarImage src={authorProfile?.photoURL || undefined} alt={article.author} />
                                <AvatarFallback>{authorFallback}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{article.author}</p>
                                <p className="text-xs text-muted-foreground">
                                    Posted on {format(new Date(article.createdAt), 'PPP')}
                                </p>
                            </div>
                        </div>

                        <div className="prose prose-lg dark:prose-invert max-w-none">
                           <SimpleMarkdown content={article.content} />
                        </div>
                    </div>
                </article>
                <Separator className="my-12" />
                 <CommentSection
                    entityType="article"
                    entityId={article.id}
                    initialComments={initialComments}
                />
            </div>
        </div>
    );
}
