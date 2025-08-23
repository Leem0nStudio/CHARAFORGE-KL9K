
import 'server-only';
import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/app/actions/articles';
import { BackButton } from '@/components/back-button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

// This is a basic Markdown-to-HTML parser. 
// For a production app, a more robust library like 'marked' or 'react-markdown' would be better.
function SimpleMarkdown({ content }: { content: string }) {
    const html = content
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 border-b pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-10 mb-6 border-b pb-4">$1</h1>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">$1</code>')
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
        .split('\n')
        .map(line => {
            if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<code')) {
                return line;
            }
            if (line.trim() === '') return '';
            return `<p>${line}</p>`;
        })
        .join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}


export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const article = await getArticleBySlug(params.slug);

    if (!article) {
        notFound();
    }

    return (
        <div className="container py-8">
            <div className="max-w-3xl mx-auto">
                <BackButton />
                <article className="mt-8">
                    <h1 className="text-4xl font-bold font-headline tracking-tight">{article.title}</h1>
                    <p className="text-muted-foreground mt-2">
                        Posted on {format(new Date(article.createdAt), 'PPP')} by {article.author}
                    </p>
                    <div className="prose prose-lg dark:prose-invert max-w-none mt-8">
                       <SimpleMarkdown content={article.content} />
                    </div>
                </article>
            </div>
        </div>
    );
}
