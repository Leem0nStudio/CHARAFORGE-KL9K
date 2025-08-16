
import Link from 'next/link';
import { Bot, Github } from 'lucide-react';
import { AnvilIcon } from './app-logo';

export function SiteFooter() {
    return (
        <footer className="w-full border-t bg-card">
            <div className="container py-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex items-center gap-2">
                        <AnvilIcon />
                        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                            CharaForge &copy; {new Date().getFullYear()}. Forged with AI.
                        </p>
                    </div>
                     <div className="flex items-center gap-4">
                        <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                        <Link href="https://github.com/FirebaseExtended/charaforge" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <Github className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
      </footer>
    );
}
