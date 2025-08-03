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
    *   Open the JSON file, copy its entire content, and paste it as a single line into the `FIREBASE_SERVICE_ACCOUNT_KEY` variable in your `.env` file. **Important:** Ensure the JSON is a valid, single-line string.
5.  **(Optional) Enable Emulators:** For local development, set `NEXT_PUBLIC_USE_EMULATORS=true` in your `.env` file. You can then run the Firebase emulators in a separate terminal:
    ```bash
    firebase emulators:start --only auth,firestore
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
