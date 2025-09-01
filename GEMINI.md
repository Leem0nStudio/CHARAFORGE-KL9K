# Gemini Customization Guide

This file is used to provide specific instructions and context for Gemini's interactions with this project.

## Instructions:

-   **Adhere to Architectural Patterns:** The most critical instructions are located in `ARCHITECTURE_GUIDE.md`. All server-side actions involving authentication, data validation, and file storage **MUST** follow the patterns outlined in that document.

-   **Prioritize Server Actions:** Backend logic should be implemented as Next.js Server Actions (`src/app/actions/`) rather than traditional API routes whenever possible.

-   **Use Genkit for AI:** All AI-related functionality (LLM calls, image generation, etc.) **MUST** be implemented within Genkit flows (`src/ai/flows/`).

-   **Zod for Validation:** All data coming from the client (in Server Actions) and into/out of AI flows **MUST** be validated with a `zod` schema. Type definitions for flows should be in a separate `types.ts` file.

-   **UI Component Conventions:**
    -   Utilize **ShadCN UI** components from `/src/components/ui` as the default.
    -   Create reusable, application-specific components in `/src/components`.
    -   Styling should be done with **Tailwind CSS**, leveraging the theme variables in `globals.css`.

-   **Key Commands to Be Aware Of:**
    -   `npm run dev`: Starts the Next.js development server.
    -   `npm run genkit:dev`: Starts the Genkit development UI for testing AI flows.
    -   `npm run datapacks:seed`: Seeds the Firestore database with local DataPacks from `/data/datapacks/`. This is a critical command for development setup.
    -   `npm run admin:grant -- <uid>`: Grants admin privileges to a user. This is the only way to create an administrator.
