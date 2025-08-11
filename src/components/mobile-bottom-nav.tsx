
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Swords, Users, UserCircle, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { authUser } = useAuth();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/datapacks', label: 'DataPacks', icon: Package },
    { href: '/character-generator', label: 'Create', icon: Swords, isPrimary: true },
    { href: '/story-forge', label: 'Stories', icon: ScrollText, requiresAuth: true },
    { href: '/profile', label: 'Profile', icon: UserCircle, requiresAuth: true },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          
          if (item.requiresAuth && !authUser) {
            return <div key={item.href} className="inline-flex flex-col items-center justify-center px-5 opacity-50 cursor-not-allowed">
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
            </div>
          }

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex flex-col items-center justify-center -translate-y-3"
              >
                <div className="p-4 bg-primary rounded-full text-primary-foreground shadow-lg ring-4 ring-background">
                    <item.icon className="w-6 h-6" />
                </div>
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

    