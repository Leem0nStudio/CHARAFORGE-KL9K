
'use server';

import { getLogoUrl } from '@/lib/app-config';
import { cn } from '@/lib/utils';
import { AnvilIcon } from '@/hooks/use-auth';

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
