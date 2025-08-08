
'use server';

import Link from "next/link";
import { Swords, Package } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LoginButton } from "./login-button";
import { getLogoUrl } from "@/lib/app-config";


export async function SiteHeader() {
  const logoUrl = await getLogoUrl();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {logoUrl && (
             <img src={logoUrl} alt="CharaForge Logo" className="h-7 w-7 sm:h-10 sm:w-10" />
          )}
          <div className="font-logo text-xl sm:text-2xl tracking-wider">
              <span className="text-foreground">Chara</span>
              <span className="bg-gradient-to-tr from-accent to-yellow-500 bg-clip-text text-transparent">Forge</span>
          </div>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <Link
              href="/datapacks"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 font-headline tracking-wider h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground hidden sm:flex"
            >
              <Package className="mr-2" />
              DataPacks
            </Link>
           <Link
              href="/character-generator"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 font-headline tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 hidden sm:flex"
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
