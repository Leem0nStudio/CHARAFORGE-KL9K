
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnvilIcon } from '@/components/app-logo';
import Link from 'next/link';
import { Heart, Github, Bitcoin, Bot } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="container py-12 max-w-4xl mx-auto">
            <BackButton title="About CharaForge" description="The story behind the forge and how you can support it." />

            <div className="mt-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <AnvilIcon /> What is CharaForge?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert">
                        <p>
                            CharaForge was born from a passion for storytelling and cutting-edge AI. It&apos;s a personal project designed to empower creators—writers, artists, game masters, and dreamers—to bring their fictional characters to life with unprecedented detail and ease. Our goal is to blend the art of human creativity with the power of artificial intelligence, providing a platform that is both powerful and a joy to use.
                        </p>
                        <p>
                            This is an open-source project, meaning its code is available for anyone to view, use, and contribute to. We believe in the power of community and collaborative development.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Heart /> Support the Project
                        </CardTitle>
                        <CardDescription>
                            CharaForge is maintained by a small team, and running the AI models and servers has costs. If you find the app useful, consider supporting us. Every bit helps us keep the forges burning!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="https://github.com/sponsors/YOUR_GITHUB_USERNAME" target="_blank" rel="noopener noreferrer" className="block">
                             <div className="p-4 border rounded-lg hover:bg-muted transition-colors text-center h-full">
                                <Github className="mx-auto h-8 w-8 mb-2" />
                                <h3 className="font-semibold">Sponsor on GitHub</h3>
                                <p className="text-xs text-muted-foreground">The best way for recurring support.</p>
                            </div>
                        </Link>
                        <div className="p-4 border rounded-lg text-center">
                            <Bitcoin className="mx-auto h-8 w-8 mb-2" />
                            <h3 className="font-semibold">Donate Crypto</h3>
                            <p className="text-xs text-muted-foreground break-all mt-2">
                                <strong>BTC:</strong> bc1q...
                            </p>
                             <p className="text-xs text-muted-foreground break-all mt-1">
                                <strong>ETH:</strong> 0x...
                            </p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Bot /> Our Technology
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert">
                        <p>
                           CharaForge is built on a modern, robust tech stack designed for performance and scalability:
                        </p>
                        <ul>
                            <li><strong>Next.js & React:</strong> For a fast, server-rendered frontend.</li>
                            <li><strong>Firebase Suite:</strong> Powers our database, authentication, and file storage.</li>
                            <li><strong>Genkit:</strong> The heart of our AI orchestration layer, allowing us to flexibly use models from Google Gemini, Hugging Face, and more.</li>
                            <li><strong>Tailwind CSS & ShadCN/UI:</strong> For a beautiful and consistent user interface.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
