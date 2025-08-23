
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/back-button';
import Image from 'next/image';

// Datos de ejemplo para los artículos
const articles = [
  {
    slug: 'the-art-of-prompt-crafting',
    title: 'The Art of Prompt Crafting',
    description: 'Learn how to write effective prompts to get the most out of our AI generation tools.',
    author: 'The CharaForge Team',
    date: 'August 23, 2024',
    image: 'https://placehold.co/600x400.png?text=Prompt+Art',
  },
  {
    slug: 'getting-started-with-datapacks',
    title: 'Getting Started with DataPacks',
    description: 'A beginner\'s guide to using and understanding DataPacks for consistent character creation.',
    author: 'The CharaForge Team',
    date: 'August 20, 2024',
    image: 'https://placehold.co/600x400.png?text=DataPacks',
  },
];


export default function ArticlesPage() {
  return (
    <div className="container py-8">
        <BackButton 
            title="Articles & Updates"
            description="News, tutorials, and insights from the CharaForge team."
        />

        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
                <Card key={article.slug} className="flex flex-col">
                    <CardHeader className="p-0">
                        <Link href={`/articles/${article.slug}`}>
                            <Image
                                src={article.image}
                                alt={article.title}
                                width={600}
                                height={400}
                                className="w-full h-auto rounded-t-lg object-cover"
                            />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow">
                        <CardTitle className="text-xl font-bold">
                            <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                        </CardTitle>
                        <CardDescription className="mt-2">{article.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 text-sm text-muted-foreground">
                        <span>By {article.author} on {article.date}</span>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}
