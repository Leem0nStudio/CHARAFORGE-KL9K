
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
import { getUserProfile } from '@/app/actions/user';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Safe markdown component using react-markdown with sanitization
function SafeMarkdown({ content }: { content: string }) {
    // Remove the first image from the content as it's now the cover
    const contentWithoutCover = content.replace(/!\[.*?\]\(.*?\)/, '');
    
    return (
        <div className="space-y-4">
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className="text-4xl font-bold mt-10 mb-6 border-b pb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold mt-6 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4">{children}</p>,
                    strong: ({ children }) => <strong>{children}</strong>,
                    em: ({ children }) => <em>{children}</em>,
                    code: ({ children }) => <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>,
                }}
            >
                {contentWithoutCover}
            </ReactMarkdown>
        </div>
    );
}

const extractCoverImage = (content: string): string | null => {
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    return match ? match[1] : null;
};

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const article = await getArticleBySlug(params.slug);

    if (!article) {
        notFound();
    }
    
    const [initialComments, authorProfile] = await Promise.all([
        getComments('article', article.id),
        getUserProfile(article.userId)
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
                           <SafeMarkdown content={article.content} />
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
