
# CharaForge: AI Character Forge (v3)

CharaForge is a modern, full-stack web application built with Next.js and Firebase, designed for generating, managing, and sharing fictional characters using generative AI. It provides a robust platform for writers, game masters, and creatives to bring their ideas to life with detailed biographies and unique, AI-generated portraits.

## Core Features

-   **Multi-Engine AI Generation**: Utilizes a flexible AI layer powered by **Genkit** to generate content using various models and services, including **Google Gemini**, **Hugging Face**, and any **OpenRouter** compatible model (like DALL-E 3 or SDXL Turbo).
-   **DataPack System**: A powerful prompt-engineering feature that allows users to create characters using thematic wizards (e.g., "Cyberpunk," "Fantasy," "Horror Punk"), ensuring high-quality, genre-specific results.
-   **Custom Model Support**: Users can register their own models and LoRAs from Hugging Face, enabling a deeply personalized generation experience.
-   **Story Forge**: A narrative generation tool that takes a user-created cast of characters and a prompt to write compelling short stories.
-   **Community & Sharing**: Public galleries for both characters and DataPacks, allowing users to share their creations and be inspired by the community.
-   **Versioning & Branching**: Users can create new versions of their characters or "branch" from public characters created by others to build upon their work.
-   **Secure Authentication**: A complete, secure user management system built with Firebase Authentication, featuring a robust cookie-based session management for Server Actions.
-   **Admin Panel**: A dedicated, role-protected section for managing application content like DataPacks and system-wide AI models.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Backend & Database**:
    -   **Authentication**: Firebase Authentication
    -   **Database**: Firestore (NoSQL)
    -   **Storage**: Firebase Storage (for images and assets)
-   **AI Layer**: [Genkit](https://firebase.google.com/docs/genkit) with `@genkit-ai/googleai`. Supports Google Gemini, Hugging Face, and OpenRouter.
-   **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: React Hooks & Context API (`useAuth`).
-   **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for schema validation.
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)

---

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Install Dependencies

First, install the necessary npm packages:

```bash
npm install
```

### 2. Configure Environment Variables

The project relies on environment variables to connect to Firebase and AI services.

1.  **Create a `.env` file**: Copy the example file `/.env.example` to a new file named `.env` in the project's root directory.
2.  **Set up a Firebase Project**: If you haven't already, create a new project in the [Firebase Console](https://console.firebase.google.com/).
3.  **Get Web App Credentials**: In your Firebase project, go to **Project Settings** > **General**. Under "Your apps," click the **</>** icon to register a new web app. Copy the `firebaseConfig` object values and paste them into the corresponding `NEXT_PUBLIC_FIREBASE_*` variables in your `.env` file.
4.  **Get a Service Account Key**: For the Admin SDK to function, a service account is required.
    *   In your Firebase project, go to **Project Settings** > **Service accounts**.
    *   Click **Generate new private key**. A JSON file will be downloaded.
    *   **CRITICAL**: Copy the *entire content* of the JSON file and paste it as a **single line** into the `FIREBASE_SERVICE_ACCOUNT_KEY` variable in your `.env` file. It must start with `{` and end with `}` with no line breaks.
5.  **Get AI API Keys (Optional but Recommended)**:
    *   **Gemini**: Go to the [Google AI Studio](https://aistudio.google.com/app/apikey) to generate an API key. Paste this into `GEMINI_API_KEY`.
    *   **Hugging Face**: Create an API token in your [Hugging Face settings](https://huggingface.co/settings/tokens). Paste this into `HUGGING_FACE_API_KEY`.
    *   **OpenRouter**: Get a key from the [OpenRouter keys page](https://openrouter.ai/keys). Paste this into `OPENROUTER_API_KEY`.
    *   *Note: These system-level keys will be used by default for all users. Users can also provide their own keys in their profile settings.*
6.  **Validate your setup**: Run the built-in validator to check your environment variables:
    ```bash
    npm run firebase:setup
    ```

### 3. Run the Development Server

Once your environment is configured, start the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

---

## Architecture Overview

CharaForge is built using a modern, server-centric approach with the Next.js App Router. For a detailed explanation of architectural patterns, see `ARCHITECTURE_GUIDE.md`.

### Frontend (`/src/components` & `/src/app`)

-   The UI is built with **React Server Components (RSC)** by default, which improves performance by rendering on the server. Client-side interactivity is introduced via the `'use client'` directive where needed (e.g., forms, interactive buttons).
-   UI components are sourced from the excellent [ShadCN UI](https://ui.shadcn.com/) library (`/src/components/ui`) and supplemented with custom, reusable application components (`/src/components`).

### Backend (Server Actions)

-   Instead of traditional API routes, CharaForge heavily relies on **Next.js Server Actions** for backend logic. These are asynchronous functions that execute on the server but can be called directly from client components.
-   All server-side logic is co-located in `/src/app/actions/`, organized by domain (e.g., `character-write.ts`, `datapacks.ts`). This simplifies the architecture by removing the need for a separate API layer.

### Authentication Flow (HTTPOnly Cookie)

The authentication system is designed to be robust and secure, especially for Server Actions. See `ARCHITECTURE_GUIDE.md` for a full breakdown.

1.  **Client-Side Login**: A user signs in using the Firebase client SDK.
2.  **Token to Server**: The `idToken` received from Firebase is sent to a dedicated API route (`/api/auth/set-cookie`).
3.  **Set Secure Cookie**: This route creates an **HTTPOnly, secure cookie** containing the token. `HTTPOnly` means the cookie cannot be accessed by client-side JavaScript, protecting against XSS attacks.
4.  **Server Action Verification**: Every Server Action that requires authentication calls a gatekeeper function, `verifyAndGetUid` (`/src/lib/auth/server.ts`). This function reads the cookie from the request headers, verifies the token using the Firebase Admin SDK, and returns the user's UID or throws an error.

### AI Layer (Genkit)

-   All interactions with the generative AI models are abstracted into **Genkit Flows**, located in `/src/ai/flows/`.
-   Each flow defines its input and output schemas using **Zod**, ensuring all data passed to and from the AI is strongly typed and structured.
-   A centralized utility (`/src/ai/utils/llm-utils.ts`) acts as a switchboard to direct requests to the correct engine (Gemini, Hugging Face, OpenRouter) based on user selection and configuration.
-   This architecture allows AI logic to be decoupled from the UI and Server Actions, making it easy to manage, version, and even swap out models in the future.

### Database Schema (Firestore)

-   `users`: Stores public user profiles, preferences (including personal API keys), roles, and stats.
-   `characters`: The core collection. Stores all generated character data, including the prompt, bio, image URLs, owner's ID, versioning info, and sharing status.
-   `datapacks`: Contains the DataPack definitions, including their name, description, and the crucial `schema` object which dictates how the generation wizard behaves.
-   `ai_models`: Contains definitions for system-wide and user-specific AI models and LoRAs, including their Hugging Face IDs and trigger words.
-   `storyCasts`: Stores user-created "casts" (collections of character IDs) used by the Story Forge.

---

## Key Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production build of the application.
-   `npm run firebase:setup`: Validates your `.env` file configuration.
-   `npm run datapacks:seed`: Seeds the Firestore database with the local DataPacks located in `/data/datapacks/`.
-   `npm run admin:grant -- <uid>`: Grants admin role to a user. (Use `--` before the UID).
-   `npm run admin:list`: Lists all users with the admin role.
