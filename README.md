# CharaForge: Forja de Personajes con IA (v3)

CharaForge es una aplicación web moderna y full-stack construida con Next.js y Supabase, diseñada para generar, gestionar y compartir personajes de ficción utilizando IA generativa. Proporciona una plataforma robusta para que escritores, directores de juego y creativos den vida a sus ideas con biografías detalladas y retratos únicos generados por IA.

## Funcionalidades Principales

-   **Generación de IA Multi-Motor**: Utiliza una capa de IA flexible impulsada por **Genkit** para generar contenido utilizando varios modelos y servicios, incluyendo **Google Gemini**, **Hugging Face**, **OpenRouter** y un servidor **ComfyUI** centralizado.
-   **Sistema de DataPacks**: Una potente función de ingeniería de prompts que permite a los usuarios crear personajes utilizando asistentes temáticos (p. ej., "Cyberpunk", "Fantasía", "Punk de Terror"), asegurando resultados de alta calidad y específicos del género.
-   **Soporte de Modelos Personalizados**: Los usuarios pueden registrar sus propios modelos y LoRAs desde Hugging Face, Civitai o ModelsLab, permitiendo una experiencia de generación profundamente personalizada.
-   **Lore Forge**: Una herramienta de generación de narrativas que toma un elenco de personajes creado por el usuario y un prompt para escribir historias cortas convincentes.
-   **Comunidad y Compartir**: Galerías públicas tanto para personajes como para DataPacks, permitiendo a los usuarios compartir sus creaciones e inspirarse en la comunidad.
-   **Versionado y Ramificación (Branching)**: Los usuarios pueden crear nuevas versiones de sus personajes o "ramificar" personajes públicos creados por otros para construir sobre su trabajo.
-   **Autenticación Segura**: Sistema de gestión de usuarios con **Supabase Auth**, que incluye una robusta gestión de sesiones para Server Actions a través de middleware.
-   **Panel de Administración**: Una sección dedicada y protegida por roles para gestionar el contenido de la aplicación como los DataPacks y los modelos de IA.

## Stack Tecnológico

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Lenguaje**: TypeScript
-   **Backend y Base de Datos (BaaS)**: [Supabase](https://supabase.com/)
    -   **Autenticación**: Supabase Auth
    -   **Base de Datos**: Supabase (Postgres)
    -   **Almacenamiento**: Supabase Storage
-   **Capa de IA**: [Genkit](https://firebase.google.com/docs/genkit) con `@genkit-ai/googleai`. Soporta Google Gemini, Hugging Face, OpenRouter y ComfyUI.
-   **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Gestión de Estado**: React Hooks y Context API (`useAuth`).
-   **Formularios**: [React Hook Form](https://react-hook-form.com/) y [Zod](https://zod.dev/) para validación.
-   **Despliegue**: [Vercel](https://vercel.com/)

---

## Cómo Empezar

Sigue estos pasos para tener el proyecto funcionando en tu máquina local.

### 1. Instalar Dependencias

Primero, instala los paquetes npm necesarios:

```bash
npm install
```

### 2. Configurar Variables de Entorno con Supabase

El proyecto ahora depende de Supabase para su backend.

1.  **Crear un Proyecto en Supabase**: Si aún no lo has hecho, regístrate en [Supabase](https://supabase.com/) y crea un nuevo proyecto.
2.  **Obtener las Claves de API**:
    *   En tu proyecto de Supabase, ve a **Settings** (icono de engranaje) > **API**.
    *   Necesitarás dos claves públicas y una secreta.
3.  **Crear el archivo `.env.local`**: Copia el archivo de ejemplo `/.env.example` a un nuevo archivo llamado `.env.local` en la raíz del proyecto.
4.  **Añadir las Claves de Supabase**:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Pega aquí la **URL del Proyecto**.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Pega aquí la clave `anon` `public`.
    *   `SUPABASE_SERVICE_ROLE_KEY`: **CRÍTICO**: Pega aquí la clave `service_role` `secret`. Esta clave es para uso del servidor y nunca debe exponerse en el navegador.
5.  **Obtener Claves de API de IA (Opcional pero Recomendado)**:
    *   **Gemini**: Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) para generar una clave de API. Pégala en `GEMINI_API_KEY`.
    *   **Hugging Face, OpenRouter, etc.**: Añade las claves correspondientes si deseas usar esos servicios.
6.  **Configurar Almacenamiento de Modelos (Opcional)**:
    *   Si deseas utilizar la función de sincronización de modelos, crea un nuevo bucket de Google Cloud Storage y pega su nombre en la variable `MODELS_STORAGE_BUCKET`.

### 3. Aplicar Migraciones de Base de Datos

Usamos la CLI de Supabase para gestionar el esquema de la base de datos. Para más detalles, consulta `VERCEL_MIGRATION_GUIDE.md`.

```bash
# Instalar la CLI si no la tienes
npm install supabase --save-dev

# Conectar tu proyecto local con tu proyecto remoto de Supabase
npx supabase link --project-ref TU_ID_DE_PROYECTO

# Aplicar las migraciones para crear las tablas
npx supabase db push
```

### 4. Ejecutar el Servidor de Desarrollo

Una vez que tu entorno esté configurado, inicia el servidor de desarrollo de Next.js:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Resumen de la Arquitectura (Post-Migración)

CharaForge está construido sobre Vercel y Supabase, aprovechando un stack moderno y eficiente.

### Frontend (`/src/components` y `/src/app`)

-   La UI está construida con **React Server Components (RSC)** por defecto, utilizando la directiva `'use client'` donde se necesita interactividad.
-   Los componentes de la UI provienen de [ShadCN UI](https://ui.shadcn.com/).

### Backend (Server Actions y Supabase)

-   La lógica de backend se maneja principalmente con **Next.js Server Actions**, que se ejecutan de forma segura en el servidor.
-   **Supabase** actúa como el backend completo, proporcionando la base de datos PostgreSQL, autenticación de usuarios y almacenamiento de archivos.

### Flujo de Autenticación (Supabase Middleware)

-   El sistema utiliza un **middleware de Next.js** para gestionar las sesiones de usuario con Supabase.
-   Este middleware inspecciona y refresca las sesiones en cada solicitud, asegurando que la información de autenticación esté siempre actualizada tanto en el cliente como en el servidor.
-   Las Server Actions protegidas utilizan un gatekeeper (`verifyAndGetUid`) que valida la sesión a través del cliente de servidor de Supabase.

### Capa de IA (Genkit)

-   Todas las interacciones con los modelos de IA generativa se abstraen en **Flujos de Genkit**, ubicados en `/src/ai/flows/`.
-   Esta capa es independiente del backend de la aplicación y se comunica directamente con las APIs de los modelos de IA (Gemini, Hugging Face, etc.).

### Esquema de la Base de Datos (Supabase/PostgreSQL)

-   `users`: Almacena perfiles de usuario, roles y preferencias.
-   `characters`: La colección principal. Almacena todos los datos de personajes.
-   `datapacks`: Contiene las definiciones de los DataPacks.
-   `ai_models`: Contiene definiciones para modelos de IA y LoRAs.
-   ... y otras tablas para `likes`, `comments`, etc.

---

## Scripts Clave

-   `npm run dev`: Inicia el servidor de desarrollo.
-   `npm run build`: Crea una compilación de producción.
-   `npm run datapacks:seed`: Siembra la base de datos de Supabase con los DataPacks locales.
-   `npm run admin:grant -- <uid>`: Otorga el rol de administrador a un usuario.
-   `npm run admin:list`: Lista todos los usuarios con el rol de administrador.
