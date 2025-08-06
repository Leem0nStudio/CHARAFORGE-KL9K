
import { Bot } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="py-6 md:px-8 md:py-0 mt-16 border-t">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-muted-foreground" />
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                CharaForge &copy; {new Date().getFullYear()}. Forged with AI.
                </p>
            </div>
            </div>
      </footer>
    );
}
