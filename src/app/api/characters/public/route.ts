// This file is deprecated and can be removed.
// Public characters are now fetched via the `getPublicCharacters` server action in `src/app/actions/creations.ts`.

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "This endpoint is deprecated. Please use the relevant server action." }, { status: 410 });
}
