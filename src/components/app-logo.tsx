
'use server';

import { getLogoUrl } from '@/lib/app-config';
import { cn } from '@/lib/utils';

// The AnvilIcon is now a self-contained component, ready to be used as a fallback.
export const AnvilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
             <linearGradient id="anvilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(36 91% 52%)" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
        </defs>
        <path fill="url(#anvilGradient)" d="M494.67 203.26C494.67 175.7 482.37 151 462.61 134.42C442.84 117.84 417.16 107.59 389.33 107.59H378.67V58.52C378.67 35.87 362.4 17.07 342.64 0H169.36C149.6 17.07 133.33 35.87 133.33 58.52V107.59H122.67C94.84 107.59 69.16 117.84 49.39 134.42C29.63 151 17.33 175.7 17.33 203.26V231.25H494.67V203.26ZM184.53 158.58C177.65 158.58 172.27 153.2 172.27 146.31V72.5C172.27 65.6 177.65 60.22 184.53 60.22C191.42 60.22 196.8 65.6 196.8 72.5V146.31C196.8 153.2 191.42 158.58 184.53 158.58ZM327.47 158.58C320.58 158.58 315.2 153.2 315.2 146.31V72.5C315.2 65.6 320.58 60.22 327.47 60.22C334.35 60.22 339.73 65.6 339.73 72.5V146.31C339.73 153.2 334.35 158.58 327.47 158.58Z M0 259.23V404.99C0 422.03 5.43 438.16 16.28 451.5C27.13 464.84 42.11 474.83 61.22 479.51L109.33 492.41V512H402.67V492.41L450.78 479.51C469.89 474.83 484.87 464.84 495.72 451.5C506.57 438.16 512 422.03 512 404.99V259.23H0Z"/>
    </svg>
);


/**
 * A reusable server component that displays the user-uploaded logo
 * or falls back to the default AnvilIcon.
 * @param className - Optional classes to apply to the container.
 * @param iconClassName - Optional classes to apply to the icon/image itself.
 */
export async function AppLogo({ className, iconClassName }: { className?: string, iconClassName?: string }) {
    const logoUrl = await getLogoUrl();

    return (
        <div className={className}>
            {logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt="CharaForge Logo" 
                    className={cn("h-7 w-7 sm:h-10 sm:w-10", iconClassName)}
                />
            ) : (
                <AnvilIcon 
                    className={cn("h-8 w-8", iconClassName)}
                />
            )}
        </div>
    );
}
