# Application Context for Gemini

This file provides Gemini with essential context about the application to facilitate more effective assistance.

## 1. Application Overview

CharaForge is a full-stack web application designed for creative individuals like writers, artists, and game masters. Its primary purpose is to streamline the creation of fictional characters by leveraging generative AI.

-   **Problem it Solves:** It overcomes creative blocks and saves time by generating rich, detailed character biographies and unique, AI-powered portraits from simple user prompts.
-   **Primary Users:** Writers, tabletop RPG game masters, artists, and any creative person who needs to develop characters for their projects.
-   **Core Functionality:**
    -   **AI-Powered Generation:** Uses Genkit to orchestrate calls to various AI models (like Google Gemini) for text and image creation.
    -   **DataPacks System:** A powerful prompt-engineering feature that allows users to create characters within specific themes (e.g., "Cyberpunk", "High Fantasy") using a guided wizard.
    -   **Community & Sharing:** Features public galleries for characters and DataPacks, allowing users to share their work and get inspired.
    -   **Secure Authentication:** A robust user management system using Firebase Authentication, with secure session handling for server-side operations.
    -   **Admin Panel:** A dedicated, role-protected section for managing application-wide content like official DataPacks and AI models.

## 2. Architecture Highlights

CharaForge is built on a modern, server-centric architecture using the Next.js App Router.

-   **Frontend:** Primarily built with **React Server Components (RSC)** for optimal performance and SEO. Interactive UI elements are built as Client Components using the `'use client'` directive. UI components are sourced from **ShadCN UI** and styled with **Tailwind CSS**.
-   **Backend:** Logic is primarily handled by **Next.js Server Actions**, co-located in `src/app/actions/`. This provides a tight integration between client and server logic without the need for traditional REST API routes for most operations.
-   **AI Orchestration:** All AI-related tasks are managed by **Genkit**, with flows defined in `src/ai/flows/`. This provides a flexible layer to interact with various AI models (e.g., Google Gemini, Hugging Face, OpenRouter, ComfyUI).
-   **Database:** **Firestore (NoSQL)** is the primary database for storing all persistent data, including user profiles, characters, and DataPacks.
-   **Authentication:** Uses **Firebase Authentication** on the client-side. For secure server-side operations (in Server Actions), it employs a session management system using **secure, HTTPOnly cookies**, which is considered a best practice. See `ARCHITECTURE_GUIDE.md` for details.
-   **File Storage:** **Firebase Storage** is used for user-generated assets like character images. **Google Cloud Storage** is used for heavier assets like AI model files.
-   **Background Jobs:** Asynchronous and long-running tasks, such as image processing or AI model synchronization, are handled by **Cloud Functions for Firebase**, often triggered by events (like a file upload) or queued via **Cloud Tasks**.

## 3. Key Technologies

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** ShadCN UI, Radix UI (primitives), Framer Motion (animations)
-   **Backend Logic:** Next.js Server Actions
-   **Database & Auth:** Firebase (Firestore, Authentication, Storage), Google Cloud Storage
-   **AI Layer:** Genkit, Zod (for AI schema validation)
-   **Form Management:** React Hook Form
-   **Deployment:** Vercel / Firebase Hosting / Google App Engine

## 4. Development Workflow

-   **Run Development Server:**
    ```bash
    npm run dev
    ```
-   **Run Genkit Development UI (for testing flows):**
    ```bash
    npm run genkit:dev
    ```
-   **Run Firebase Emulators:**
    ```bash
    npm run firebase:emulators
    ```
-   **Build for Production:**
    ```bash
    npm run build
    ```
-   **Lint & Type-check:**
    ```bash
    npm run lint
    npm run typecheck
    ```
-   **Seed Database:** To populate Firestore with the local DataPacks found in `/data/datapacks/`, run:
    ```bash
    npm run datapacks:seed
    ```
-   **Grant Admin Privileges:**
    ```bash
    # Get your UID from your profile page first
    npm run admin:grant -- <your-uid>
    ```

## 5. Important Directories/Files

-   **`src/app/`**: The core of the application, containing all pages and routes according to the App Router convention.
-   **`src/app/actions/`**: Contains all Next.js Server Actions, which act as the application's backend logic. Organized by domain (e.g., `character-write.ts`, `datapacks.ts`).
-   **`src/ai/flows/`**: Contains all Genkit flows for AI interactions. Each flow is typically separated into its own folder with `flow.ts` (logic) and `types.ts` (Zod schemas).
-   **`src/components/`**: Location for reusable React components, with `ui/` containing the base ShadCN components.
-   **`src/lib/`**: Utility functions, Firebase client/server configurations, and app-wide configurations.
    -   `src/lib/firebase/client.ts`: Firebase client-side initialization.
    -   `src/lib/firebase/server.ts`: Firebase Admin SDK initialization.
    -   `src/lib/auth/server.ts`: Contains the critical `verifyAndGetUid` function for protecting server actions.
-   **`src/types/`**: Contains all major TypeScript type definitions and Zod schemas for data structures (e.g., `character.ts`, `datapack.ts`).
-   **`data/datapacks/`**: Contains the raw JSON definitions for the default DataPacks that are seeded into the database.
-   **`ARCHITECTURE_GUIDE.md`**: The source of truth for the project's core architectural patterns. **MUST READ.**
