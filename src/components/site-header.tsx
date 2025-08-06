
'use client';

import Link from "next/link";
import { Swords, Package } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LoginButton } from "./login-button";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <div className="font-bold font-headline text-xl sm:text-2xl tracking-wider">
            <span className="text-foreground">Chara</span>
            <span className="bg-gradient-to-tr from-accent to-yellow-500 bg-clip-text text-transparent">Forge</span>
          </div>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <Link
              href="/datapacks"
              className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex")}
            >
              <Package className="mr-2" />
              DataPacks
            </Link>
           <Link
              href="/character-generator"
              className={cn(buttonVariants(), "bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:flex font-headline")}
            >
              <Swords className="mr-2" />
              Create
            </Link>
          <LoginButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
