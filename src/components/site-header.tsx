
'use client';

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LoginButton } from "./login-button";
import { buttonVariants } from "./ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            <div className="font-bold font-headline text-2xl tracking-wider">
              <span className="text-foreground">Chara</span>
              <span className="bg-gradient-to-t from-accent from-70% to-yellow-600/80 bg-clip-text text-transparent">Forge</span>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Link
              href="/character-generator"
              className={buttonVariants({
                variant: "ghost",
              })}
            >
              Create
            </Link>
            <LoginButton />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
