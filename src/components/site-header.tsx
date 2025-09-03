

'use server';

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LoginButton } from "./login-button";
import { AnvilIcon } from "./app-logo";
import { mainNavItems } from "@/lib/app-config";
import { Button } from "./ui/button";

export async function SiteHeader() {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AnvilIcon />
          <span className="font-headline text-2xl tracking-wider">CharaForge</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
             {mainNavItems.filter(item => !item.isPrimary && item.href !== '/').map(item => (
                 <Button key={item.href} variant="ghost" asChild>
                    <Link href={item.href}>
                        <item.icon className="mr-2" />
                        {item.label}
                    </Link>
                 </Button>
             ))}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
           {mainNavItems.filter(item => item.isPrimary).map(item => (
                <Button key={item.href} asChild className="hidden sm:flex">
                     <Link href={item.href}>
                        <item.icon className="mr-2" />
                        {item.label}
                    </Link>
                </Button>
           ))}
          <LoginButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
