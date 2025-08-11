# CharaForge - Firebase Studio Starter

This is a Next.js starter project built with Firebase Studio, designed to provide a robust foundation for building modern web applications. It comes pre-configured with a complete user management system, AI-powered features, and a modern UI stack.

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Install Dependencies

First, install the necessary npm packages:

```bash
npm install
```

### 2. Configure Environment Variables

The project relies on environment variables to connect to Firebase services.

1.  **Create a `.env` file:** Copy the example file `/.env.example` to a new file named `.env` in the root of the project.
2.  **Set up a Firebase Project:** If you haven't already, create a new project in the [Firebase Console](https://console.firebase.google.com/).
3.  **Get Web App Credentials:**
    *   In your Firebase project, go to **Project Settings** > **General**.
    *   Under "Your apps", click the **</>** icon to register a new web app.
    *   Copy the `firebaseConfig` object values and paste them into the corresponding `NEXT_PUBLIC_FIREBASE_*` variables in your `.env` file.
4.  **Get a Service Account Key (for Admin SDK):**
    *   In your Firebase project, go to **Project Settings** > **Service accounts**.
    *   Click **Generate new private key**. A JSON file will be downloaded.
    *   Open the JSON file, copy its entire content, and paste it as a single line into the `FIREBASE_SERVICE_ACCOUNT_KEY` variable in your `.env` file.
    *   **CRITICAL:** The entire JSON content must be on a single line. Some text editors might automatically format it to multiple lines. You can use an online "JSON to single line" tool to be sure. The value should start with `{` and end with `}` and have no line breaks in between.
5.  **(Optional) Enable Emulators:** For local development, set `NEXT_PUBLIC_USE_EMULATORS=true` in your `.env` file. You can then run the Firebase emulators in a separate terminal:
    ```bash
    firebase emulators:start --only auth,firestore
    ```
6.  **Validate your setup:** Run the built-in validator to check your environment variables:
    ```bash
    npm run firebase:setup
    ```

### 3. Run the Development Server

Once your environment is configured, start the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## Admin Role Management

The application includes a script to manage user roles directly from the command line. This is essential for assigning the first administrator.

**Available Commands:**

*   `npm run admin:grant -- <uid>`: Grants admin role to a user.
*   `npm run admin:revoke -- <uid>`: Revokes admin role from a user.
*   `npm run admin:check -- <uid>`: Checks if a user is an admin.
*   `npm run admin:list`: Lists all admin users.

**Note:** Replace `<uid>` with the actual User ID from the Firebase Authentication console. You must use `--` after the script name when passing arguments.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Authentication & DB:** [Firebase](https://firebase.google.com/) (Auth, Firestore, Admin SDK)
*   **AI:** [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models
*   **UI:** [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)


---

## For AIs: Technical Overview

### 1. Project Purpose

**CharaForge** is a web application for generating fictional characters using generative AI. Users can describe a character concept to receive a detailed biography and a unique portrait. The core experience is enhanced by "DataPacks," which are thematic templates that guide the AI to create characters within specific genres (e.g., fantasy, cyberpunk). The application also includes social features like public galleries, character branching, and a "Story Forge" to create narratives with the generated characters.

### 2. Tech Stack

- **Framework:** Next.js 15.3+ (using the App Router).
- **Language:** TypeScript.
- **UI:** React 18.3+, ShadCN UI component library, Tailwind CSS for styling. `framer-motion` is used for animations.
- **Backend & Database:** Firebase is the primary backend service provider.
  - **Authentication:** Firebase Authentication (Email/Password).
  - **Database:** Firestore is used as the primary NoSQL database.
  - **Storage:** Firebase Storage for user-uploaded images (avatars) and AI-generated content.
- **AI Layer:** Genkit is used to define and manage all AI-related tasks.
  - **Model Provider:** `@genkit-ai/googleai` for interfacing with Google's Gemini models (1.5 Flash for text, 2.0 Flash for images).
- **State Management:** Primarily React hooks (`useState`, `useEffect`) and Context API (`useAuth`).
- **Forms:** React Hook Form with Zod for schema validation.

### 3. Architecture

#### 3.1. Frontend (Client Components & RSC)

- The UI is built using React Server Components (RSC) by default, with client-side interactivity introduced via `'use client'` directives where necessary.
- UI components are sourced from `shadcn/ui` and located in `src/components/ui`. Custom, reusable application components are in `src/components`.
- The main application layout is defined in `src/app/layout.tsx`, which sets up theme providers, fonts, and the main `AuthProvider`.

#### 3.2. Backend (Server Actions)

- All backend logic (database interactions, business logic) is implemented as **Next.js Server Actions**.
- These actions are located in `src/app/actions/`. This co-location of backend logic with the frontend framework simplifies the architecture by eliminating the need for separate API routes for most operations.
- Actions are strongly typed and often use Zod for input validation.

#### 3.3. Authentication Flow

- A custom `useAuth` hook (`src/hooks/use-auth.tsx`) manages the user's authentication state on the client.
- Upon login, the Firebase client SDK provides an ID token. This token is sent to a custom API route (`src/app/api/auth/set-cookie/route.ts`) which sets a secure, **HTTPOnly cookie** named `firebaseIdToken`.
- All Server Actions are protected by calling a helper function, `verifyAndGetUid` (`src/lib/auth/server.ts`), which reads the cookie, verifies the token using the Firebase Admin SDK, and returns the user's UID or throws an error. This is the critical mechanism for securing server-side logic.

#### 3.4. AI Layer (Genkit Flows)

- All interactions with the generative AI models are abstracted into **Genkit Flows**, located in `src/ai/flows/`.
- Each flow defines its input and output schemas using Zod (`types.ts`) and the core logic for calling the AI model (`flow.ts`).
- **Key Flows:**
  - `character-bio`: Generates a text biography from a description.
  - `character-image`: Generates a character portrait. It includes specific error handling for safety filter rejections.
  - `datapack-schema`: Generates a complete JSON schema for a DataPack based on a user's concept.
  - `story-generation`: Takes a cast of characters and a prompt to write a short story.
  - `danbooru-tag-suggestion`: Uses a Genkit Tool (`searchTagsTool`) to query a local tag database and suggest relevant tags to the user.

#### 3.5. Database Schema (Firestore)

- `users`: Stores public user profiles, preferences, roles, and stats (e.g., `installedPacks`).
- `characters`: The core collection. Stores all generated character data, including the prompt, bio, image URLs, owner's ID, versioning info, and sharing status.
- `datapacks`: Contains the DataPack definitions, including their name, description, and the crucial `schema` object which dictates how the generation wizard behaves.
- `storyCasts`: Stores user-created "casts" (collections of character IDs) used by the Story Forge.

### 4. Key Features (Technical Implementation)

- **Character Generation:** The main generator (`src/components/character-generator.tsx`) is a client component that calls the `generateCharacterBio` and `generateCharacterImage` flows. It manages the multi-step state of generation (bio first, then image).
- **DataPack System:**
  - DataPacks are defined by `datapack.json` files in `data/datapacks/`. A seeding script (`scripts/seed-datapacks.ts`) uploads this data to Firestore.
  - The `DataPackSelectorModal` (`src/components/datapack-selector-modal.tsx`) allows users to choose an *installed* pack and use its schema to generate a detailed prompt via a dynamic form wizard.
- **Story Forge:**
  - Located at `src/app/story-forge/page.tsx`, this feature allows users to create `StoryCast` documents.
  - They can then select a cast, provide a prompt, and call the `generateStory` action, which in turn executes the corresponding Genkit flow.
- **Admin Panel:**
  - A dedicated section under `/admin` protected by an admin role check.
  - Allows for CRUD operations on DataPacks via the `EditDataPackForm`.
- **Versioning & Branching:**
  - When a user creates a "new version" of their character, the `createCharacterVersion` action duplicates the character data but increments the `version` number and updates the `versions` array on all related documents.
  - "Branching" (`branchCharacter` action) is similar but changes the `userId` to the new owner and preserves lineage information (`branchedFromId`, `originalAuthorId`).
