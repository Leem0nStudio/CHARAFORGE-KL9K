
'use server';

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LoginButton } from "./login-button";
import { AppLogo } from "./app-logo";
import { mainNavItems } from "@/lib/app-config";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";


export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AppLogo />
          <div className="font-logo text-xl sm:text-2xl tracking-wider uppercase">
              <span className="text-foreground">Chara</span>
              <span className="bg-gradient-to-tr from-accent to-yellow-500 bg-clip-text text-transparent">Forge</span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
             {mainNavItems.filter(item => !item.isPrimary && item.href !== '/').map(item => (
                 <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 font-button tracking-wider h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                 >
                    <item.icon className="mr-2" />
                    {item.label}
                 </Link>
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
