
import { BackButton } from '@/components/back-button';
import { notFound } from 'next/navigation';
import Image from 'next/image';

// Datos de ejemplo para los artículos
const articles = [
  {
    slug: 'the-art-of-prompt-crafting',
    title: 'The Art of Prompt Crafting',
    description: 'Learn how to write effective prompts to get the most out of our AI generation tools.',
    author: 'The CharaForge Team',
    date: 'August 23, 2024',
    image: 'https://placehold.co/1200x600.png?text=Prompt+Art',
    content: `
## Mastering the Prompt

Writing a good prompt is more of an art than a science. The key is to be both specific and evocative. Instead of "a fantasy warrior", try "a grizzled female dwarf warrior with a braided beard, wielding a glowing battle-axe, standing on a snowy mountain peak".

### Key Principles

1.  **Specificity is King:** The more detail you provide, the better the AI can interpret your vision. Mention colors, materials, lighting, and mood.
2.  **Use Strong Verbs:** Instead of "holding a sword", try "wielding a sword" or "clutching a sword".
3.  **Combine Concepts:** Don't be afraid to mix genres! "A cyber-sorcerer in a neon-drenched city" can yield fascinating results.
    `
  },
  {
    slug: 'getting-started-with-datapacks',
    title: 'Getting Started with DataPacks',
    description: 'A beginner\'s guide to using and understanding DataPacks for consistent character creation.',
    author: 'The CharaForge Team',
    date: 'August 20, 2024',
    image: 'https://placehold.co/1200x600.png?text=DataPacks',
    content: `
## What are DataPacks?

DataPacks are the heart of CharaForge's reusable content system. They are essentially structured JSON files that define a set of options for the character generation wizard.

### Why use them?

-   **Consistency:** Ensure all characters in a specific setting share a common visual language.
-   **Speed:** Quickly generate characters without having to type out long, complex prompts every time.
-   **Community:** Share your DataPacks with others and use packs created by the community.
    `
  },
];

async function getArticleFromSlug(slug: string) {
    return articles.find(article => article.slug === slug);
}


export default async function ArticlePage({ params }: { params: { slug: string[] } }) {
    const slug = params.slug.join('/');
    const article = await getArticleFromSlug(slug);

    if (!article) {
        notFound();
    }

    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <BackButton />
            <article className="mt-8">
                <h1 className="text-4xl font-headline font-bold mb-4">{article.title}</h1>
                <p className="text-muted-foreground text-lg mb-4">{article.description}</p>
                <div className="flex items-center text-sm text-muted-foreground mb-8">
                    <span>By {article.author}</span>
                    <span className="mx-2">•</span>
                    <span>{article.date}</span>
                </div>
                <Image
                    src={article.image}
                    alt={article.title}
                    width={1200}
                    height={600}
                    className="w-full h-auto rounded-lg object-cover mb-8"
                />
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.content.replace(/\\n/g, '<br />') }} />
            </article>
        </div>
    );
}
