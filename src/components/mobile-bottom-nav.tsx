

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { mainNavItems } from '@/lib/app-config';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { authUser } = useAuth();
  
  const items = mainNavItems;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/90 backdrop-blur-sm border-t border-border">
      <div className="grid h-full max-w-lg mx-auto font-medium grid-cols-6">
        {items.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
          const requiresAuthAndIsUnauthed = item.requiresAuth && !authUser;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={requiresAuthAndIsUnauthed ? '/login' : item.href}
                className="inline-flex flex-col items-center justify-center -translate-y-4"
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
              href={requiresAuthAndIsUnauthed ? '/login' : item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-2 text-center group',
                isActive && !requiresAuthAndIsUnauthed ? 'text-primary' : 'text-muted-foreground',
                requiresAuthAndIsUnauthed ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary'
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
