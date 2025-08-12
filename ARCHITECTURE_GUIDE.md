# 🏛️ CharaForge: Architectural Guide & Best Practices

This document outlines the core architectural patterns and decisions that form the foundation of the CharaForge application. Adhering to these patterns is crucial for maintaining the security, reliability, and maintainability of the project as it evolves.

---

## 🎯 Golden Rule: The Client is Unreliable

**The single most important principle for this project is: *Never trust the client*.** All data, requests, and session information originating from the browser must be rigorously verified on the server before any action is taken.

---

## Pattern 1: Secure Session Management via HTTPOnly Cookies

**This is the mandatory pattern for handling user authentication for server-side operations.**

### The Problem It Solves
-   **Eliminates Race Conditions:** Prevents errors where a user performs an action immediately after login before the server is aware of their session.
-   **Enhances Security:** Protects user sessions from Cross-Site Scripting (XSS) attacks.

### How It Works

1.  **Client-Side Login (`use-auth.tsx`):** The user authenticates with Firebase on the client.
2.  **Token to Server (`set-cookie/route.ts`):** Upon successful login, the Firebase ID Token is immediately sent to a dedicated, internal API endpoint (`/api/auth/set-cookie`).
3.  **Secure Cookie Creation:** This endpoint creates a **secure, `HTTPOnly` cookie**.
    -   `HTTPOnly`: This flag makes the cookie inaccessible to client-side JavaScript, which is the primary defense against XSS token theft.
    -   `Secure`: Ensures the cookie is only sent over HTTPS.
    -   `SameSite=Lax`: Provides a good balance of security and usability.
4.  **Server-Side Verification (`lib/auth/server.ts`):** The `verifyAndGetUid` function is the gatekeeper for all secure server actions. It reads the token **from the cookie**, not from the request body, and verifies it using the Firebase Admin SDK.

### Implementation Rule
All Server Actions that require authentication **MUST** call `verifyAndGetUid()` as their first step. No other method of session verification from the client is permitted.

---

## Pattern 2: Rigorous Server-Side Validation with Zod

**This is the mandatory pattern for handling data submitted from the client.**

### The Problem It Solves
-   **Prevents Data Corruption:** Protects the database from malformed or unexpected data.
-   **Enhances Security:** Prevents malicious users from injecting incorrect data types or extra fields.
-   **Improves Reliability:** Catches data-related errors early, providing clear feedback instead of causing cryptic server failures.

### How It Works

1.  **Define a Schema (`actions/characters.ts`, etc.):** For every Server Action that accepts data, a `zod` schema is defined. This schema is the single source of truth for the expected data structure, types, and constraints (e.g., `min`, `max` length).
2.  **Validate on Entry:** The **very first step** inside the Server Action is to call `schema.safeParse(data)` on the incoming data.
3.  **Act on Result:**
    -   If the validation succeeds (`success: true`), the action proceeds with the sanitized, type-safe data.
    -   If the validation fails (`success: false`), the action **MUST** terminate immediately and return a descriptive error message. No database operations should occur.

### Implementation Rule
Every Server Action that receives data from the client **MUST** validate that data against a Zod schema before performing any operations.

---

## Pattern 3: Centralized File Upload Service

**This is the mandatory pattern for handling all file uploads to Firebase Storage.**

### The Problem It Solves
-   **Eliminates Code Duplication:** Prevents having multiple, slightly different implementations of file upload logic.
-   **Ensures Consistency:** Guarantees that all files (user avatars, character images, datapack covers) are handled with the same rules, metadata, and error handling.
-   **Simplifies Maintenance:** To change storage logic (e.g., add image optimization, change caching policies), you only need to modify **one file**.

### How It Works

1.  **The Single Source of Truth (`services/storage.ts`):** A single, robust `uploadToStorage` function exists in this service file.
2.  **Versatile Input:** This function is designed to intelligently handle different data sources:
    -   `File` objects from form submissions.
    -   `Data URI` strings from AI image generation.
    -   Raw `Buffer` objects if needed.
3.  **Centralized Logic:** It contains all logic for interacting with the Firebase Storage bucket, setting metadata (content type, cache control), and making the file public.

### Implementation Rule
Any part of the application that needs to upload a file to Firebase Storage **MUST** call the `uploadToStorage` service. Server Actions **MUST NOT** contain their own implementation of Firebase Storage interactions.

---

## Pattern 4: Separation of Data Schemas from AI Logic

**This is the mandatory pattern for defining the data contracts for all Genkit flows.**

### The Problem It Solves
-   **Eliminates Tight Coupling:** Prevents the logic of an AI flow from being intrinsically tied to its data structure definition.
-   **Improves Maintainability:** Makes it easy to find and manage data types without having to navigate through implementation logic. Changes to the flow's logic don't risk accidentally altering the data contract.
-   **Enables Safe Reusability:** Allows other parts of the application (React components, other server actions) to import and use the data types of a flow without importing the entire flow's logic, which prevents circular dependencies and keeps the dependency graph clean.

### How It Works

1.  **Dedicated Type Files (`*/types.ts`):** For every Genkit flow (e.g., `character-bio/flow.ts`), a corresponding `character-bio/types.ts` file exists.
2.  **Schema Definitions:** All Zod schemas (`...Schema`) and their corresponding TypeScript types (`...Input`, `...Output`) are defined and exported **exclusively** from the `types.ts` file.
3.  **Clean Flow Logic:** The `flow.ts` file is responsible only for the implementation of the AI agent. It imports its required types from its sibling `types.ts` file.

### Implementation Rule
All Zod schemas and TypeScript type definitions for a Genkit flow **MUST** reside in a dedicated `types.ts` file. The `flow.ts` file **MUST** contain only the flow's implementation logic and import its types.
