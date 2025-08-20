
'use client';

interface SectionTitleProps {
    title: string;
    subtitle: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
    return (
        <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 text-center mb-12">
            <h2 className="font-headline text-3xl leading-[1.1] sm:text-4xl md:text-5xl">{title}</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                {subtitle}
            </p>
        </div>
    );
}

    