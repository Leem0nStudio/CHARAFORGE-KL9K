
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Exo_2, Oswald } from 'next/font/google';
import { headers } from 'next/headers';

const exo2 = Exo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'CharaForge - AI Character Generation Platform',
  description: 'A SaaS platform for writers, artists, and game masters to generate, manage, and share characters using generative AI. Create unique portraits and detailed biographies for your creative projects.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use headers() within an async component as recommended by Next.js
  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased', exo2.variable, oswald.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              {!isAdminRoute && <SiteHeader />}
              <main className="flex-1">{children}</main>
              {!isAdminRoute && <SiteFooter />}
              <MobileBottomNav />
            </div>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
