import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Exo_2, Grenze_Gotisch, Rowdies } from 'next/font/google';

const exo2 = Exo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const grenzeGotisch = Grenze_Gotisch({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-headline',
});

const rowdies = Rowdies({
    subsets: ['latin'],
    weight: '700',
    variable: '--font-logo',
});


export const metadata: Metadata = {
  title: 'CharaForge',
  description: 'AI-powered character and image generation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-body antialiased', exo2.variable, grenzeGotisch.variable, rowdies.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex-1 pb-20 sm:pb-0">{children}</div>
              <SiteFooter />
              <MobileBottomNav />
            </div>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
