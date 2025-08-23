
'use client';

// This page is no longer used for user-facing editing.
// It will now redirect to the new user profile articles page.
// The admin will also use this new page for a consistent editing experience.
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LegacyEditArticleRedirectorPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    useEffect(() => {
        if (id) {
            router.replace(`/profile/articles/${id}`);
        } else {
            router.replace('/profile/articles');
        }
    }, [router, id]);

    return null;
}
