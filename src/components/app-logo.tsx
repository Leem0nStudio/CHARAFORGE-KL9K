
'use client';

import { cn } from '@/lib/utils';

/**
 * A reusable SVG icon component.
 * This is defined here to make the AppLogo component self-contained.
 */
export function AnvilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-6 w-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="anvilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <path
        d="M4 6L2 8V11H4V8H6V6H4ZM7 5V8H5V11H7V14H9V5H7ZM10 4V14H12V4H10ZM13 5V14H15V5H13ZM16 6V8H18V11H20L22 8V6H16ZM5 16V18H7V21H17V18H19V16H5Z"
        fill="url(#anvilGradient)"
      />
    </svg>
  );
}


/**
 * A reusable server component that displays the application logo.
 * It falls back to the default AnvilIcon.
 * @param className - Optional classes to apply to the container.
 * @param iconClassName - Optional classes to apply to the icon/image itself.
 */
export function AppLogo({ className, iconClassName }: { className?: string, iconClassName?: string }) {
    // For now, this component only returns the default icon.
    // The logic to fetch a dynamic logo will be added separately to avoid architectural issues.
    return (
        <div className={className}>
            <AnvilIcon 
                className={cn("h-8 w-8", iconClassName)}
            />
        </div>
    );
}
