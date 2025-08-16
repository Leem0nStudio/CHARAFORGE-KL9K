
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnvilIcon } from "@/components/app-logo";
import { adminNavItems } from "@/lib/app-config";

export function AdminSidebar() {
    const pathname = usePathname();

    return (
         <div className="hidden border-r bg-background md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                         <AnvilIcon className="h-8 w-8" />
                         <span className="font-headline text-lg">CharaForge</span>
                    </Link>
                </div>
                 <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        {adminNavItems.map(item => {
                            const isActive = item.href === '/admin' 
                                ? pathname === item.href 
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary",
                                        isActive && "bg-muted text-primary"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                   <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                      <Home className="h-4 w-4" />
                      Back to Site
                    </Link>
                </div>
            </div>
        </div>
    )
}
