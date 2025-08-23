
'use client';

// This page is no longer used for user-facing editing.
// It will now redirect to the new user profile articles page.
// The admin will also use this new page for a consistent editing experience.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyEditArticlePage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/profile/articles');
    }, [router]);

    return null;
}
