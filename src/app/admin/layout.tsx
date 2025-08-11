
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  Home,
  PanelLeft,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AnvilIcon } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adminNavItems } from "@/lib/app-config";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <AdminSidebar navItems={adminNavItems} />
            <div className="flex flex-col w-full">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs">
                             <SheetHeader className="mb-4">
                                <SheetTitle className="sr-only">CharaForge Menu</SheetTitle>
                            </SheetHeader>
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link
                                    href="/"
                                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                                >
                                    <AnvilIcon className="h-6 w-6 transition-all group-hover:scale-110" />
                                    <span className="sr-only">CharaForge</span>
                                </Link>
                                {adminNavItems.map(item => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground mt-auto"
                                >
                                    <Home className="h-5 w-5" />
                                    Back to Site
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    
                </header>
                 <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
                    <ScrollArea className="h-[calc(100vh-56px)]">
                        <div className="py-4">
                            {children}
                        </div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
}
