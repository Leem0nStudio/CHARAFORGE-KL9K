
# CharaForge: Forja de Personajes con IA (v3)

CharaForge es una aplicación web moderna y full-stack construida con Next.js y Firebase, diseñada para generar, gestionar y compartir personajes de ficción utilizando IA generativa. Proporciona una plataforma robusta para que escritores, directores de juego y creativos den vida a sus ideas con biografías detalladas y retratos únicos generados por IA.

## Funcionalidades Principales

-   **Generación de IA Multi-Motor**: Utiliza una capa de IA flexible impulsada por **Genkit** para generar contenido utilizando varios modelos y servicios, incluyendo **Google Gemini**, **Hugging Face**, **OpenRouter** y un servidor **ComfyUI** centralizado.
-   **Sistema de DataPacks**: Una potente función de ingeniería de prompts que permite a los usuarios crear personajes utilizando asistentes temáticos (p. ej., "Cyberpunk", "Fantasía", "Punk de Terror"), asegurando resultados de alta calidad y específicos del género.
-   **Soporte de Modelos Personalizados**: Los usuarios pueden registrar sus propios modelos y LoRAs desde Hugging Face, Civitai o ModelsLab, permitiendo una experiencia de generación profundamente personalizada.
-   **Lore Forge**: Una herramienta de generación de narrativas que toma un elenco de personajes creado por el usuario y un prompt para escribir historias cortas convincentes.
-   **Comunidad y Compartir**: Galerías públicas tanto para personajes como para DataPacks, permitiendo a los usuarios compartir sus creaciones e inspirarse en la comunidad.
-   **Versionado y Ramificación (Branching)**: Los usuarios pueden crear nuevas versiones de sus personajes o "ramificar" personajes públicos creados por otros para construir sobre su trabajo.
-   **Autenticación Segura**: Un sistema completo y seguro de gestión de usuarios construido con Firebase Authentication, que cuenta con una robusta gestión de sesiones basada en cookies para las Server Actions.
-   **Panel de Administración**: Una sección dedicada y protegida por roles para gestionar el contenido de la aplicación como los DataPacks, los modelos de IA de todo el sistema y la sincronización de modelos.

## Stack Tecnológico

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Lenguaje**: TypeScript
-   **Backend y Base de Datos**:
    -   **Autenticación**: Firebase Authentication
    -   **Base de Datos**: Firestore (NoSQL)
    -   **Almacenamiento**: Firebase Storage (para imágenes y activos) y Google Cloud Storage (para archivos de modelos pesados).
    -   **Funciones de Backend**: Cloud Functions for Firebase (para procesamiento de imágenes y tareas de fondo).
-   **Capa de IA**: [Genkit](https://firebase.google.com/docs/genkit) con `@genkit-ai/googleai`. Soporta Google Gemini, Hugging Face, OpenRouter y ComfyUI.
-   **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Gestión de Estado**: React Hooks y Context API (`useAuth`).
-   **Formularios**: [React Hook Form](https://react-hook-form.com/) y [Zod](https://zod.dev/) para validación de esquemas.
-   **Animaciones**: [Framer Motion](https://www.framer.com/motion/)

---

## Cómo Empezar

Sigue estos pasos para tener el proyecto funcionando en tu máquina local.

### 1. Instalar Dependencias

Primero, instala los paquetes npm necesarios:

```bash
npm install
```

### 2. Configurar Variables de Entorno

El proyecto depende de variables de entorno para conectarse a Firebase y a los servicios de IA.

1.  **Crear un archivo `.env`**: Copia el archivo de ejemplo `/.env.example` a un nuevo archivo llamado `.env` en el directorio raíz del proyecto.
2.  **Configurar un Proyecto de Firebase**: Si aún no lo has hecho, crea un nuevo proyecto en la [Consola de Firebase](https://console.firebase.google.com/).
3.  **Obtener Credenciales de la Aplicación Web**: En tu proyecto de Firebase, ve a **Configuración del Proyecto** > **General**. En "Tus apps", haz clic en el icono **</>** para registrar una nueva aplicación web. Copia los valores del objeto `firebaseConfig` y pégalos en las variables `NEXT_PUBLIC_FIREBASE_*` correspondientes en tu archivo `.env`.
4.  **Obtener una Clave de Cuenta de Servicio**: Para que el SDK de Admin funcione, se necesita una cuenta de servicio.
    *   En tu proyecto de Firebase, ve a **Configuración del Proyecto** > **Cuentas de servicio**.
    *   Haz clic en **Generar nueva clave privada**. Se descargará un archivo JSON.
    *   **CRÍTICO**: Copia *todo el contenido* del archivo JSON y pégalo como una **sola línea** en la variable `FIREBASE_SERVICE_ACCOUNT_KEY` en tu archivo `.env`. Debe empezar con `{` y terminar con `}` sin saltos de línea.
5.  **Obtener Claves de API de IA (Opcional pero Recomendado)**:
    *   **Gemini**: Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) para generar una clave de API. Pégala en `GEMINI_API_KEY`.
    *   **Hugging Face**: Crea un token de API en tu [configuración de Hugging Face](https://huggingface.co/settings/tokens). Pégalo en `HUGGING_FACE_API_KEY`.
    *   **OpenRouter**: Obtén una clave desde la [página de claves de OpenRouter](https://openrouter.ai/keys). Pégala en `OPENROUTER_API_KEY`.
    *   **Civitai**: Crea una clave de API en tu [configuración de Civitai](https://civitai.com/user/account). Pégala en `CIVITAI_API_KEY`.
    *   **ModelsLab**: Obtén una clave de tu [perfil de ModelsLab](https://modelslab.com/profile). Pégala en `MODELSLAB_API_KEY`.
6.  **Configurar Almacenamiento de Modelos (Opcional)**:
    *   Si deseas utilizar la función de sincronización de modelos, crea un nuevo bucket de Google Cloud Storage y pega su nombre (p. ej., `my-charaforge-models-bucket`) en la variable `MODELS_STORAGE_BUCKET`.
7.  **Valida tu configuración**: Ejecuta el validador incorporado para comprobar tus variables de entorno:
    ```bash
    npm run firebase:setup
    ```

### 3. Ejecutar el Servidor de Desarrollo

Una vez que tu entorno esté configurado, inicia el servidor de desarrollo de Next.js:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Resumen de la Arquitectura

CharaForge está construido utilizando un enfoque moderno y centrado en el servidor con el App Router de Next.js. Para una explicación detallada de los patrones arquitectónicos, consulta `ARCHITECTURE_GUIDE.md`.

### Frontend (`/src/components` y `/src/app`)

-   La UI está construida con **React Server Components (RSC)** por defecto, lo que mejora el rendimiento al renderizar en el servidor. La interactividad del lado del cliente se introduce mediante la directiva `'use client'` donde sea necesario (p. ej., formularios, botones interactivos).
-   Los componentes de la UI provienen de la excelente biblioteca [ShadCN UI](https://ui.shadcn.com/) (`/src/components/ui`) y se complementan con componentes de aplicación personalizados y reutilizables (`/src/components`).

### Backend (Server Actions & Cloud Functions)

-   En lugar de las rutas de API tradicionales, CharaForge depende en gran medida de las **Next.js Server Actions** para la lógica de backend. Estas son funciones asíncronas que se ejecutan en el servidor pero que pueden ser llamadas directamente desde los componentes del cliente.
-   Toda la lógica del lado del servidor está co-ubicada en `/src/app/actions/`, organizada por dominio (p. ej., `character-write.ts`, `datapacks.ts`).
-   Para tareas asíncronas y pesadas, como el procesamiento de imágenes o la generación de atributos RPG, se utiliza **Cloud Functions for Firebase**. Estas funciones se activan por eventos (como una subida a Storage) y se ejecutan de forma independiente, lo que evita timeouts en el navegador y proporciona una arquitectura más robusta y escalable.

### Flujo de Autenticación (Cookie HTTPOnly)

El sistema de autenticación está diseñado para ser robusto y seguro, especialmente para las Server Actions. Consulta `ARCHITECTURE_GUIDE.md` para un desglose completo.

1.  **Login en el Lado del Cliente**: Un usuario inicia sesión utilizando el SDK cliente de Firebase.
2.  **Token al Servidor**: El `idToken` recibido de Firebase se envía a una ruta de API dedicada (`/api/auth/set-cookie`).
3.  **Creación de Cookie Segura**: Esta ruta crea una cookie **HTTPOnly, segura** que contiene el token. `HTTPOnly` significa que la cookie no puede ser accedida por JavaScript del lado del cliente, protegiendo contra ataques de robo de tokens XSS.
4.  **Verificación en Server Action**: Cada Server Action que requiere autenticación llama a una función guardiana, `verifyAndGetUid` (`/src/lib/auth/server.ts`). Esta función lee la cookie de las cabeceras de la solicitud, verifica el token utilizando el SDK de Firebase Admin y devuelve el UID del usuario o lanza un error.

### Capa de IA (Genkit)

-   Todas las interacciones con los modelos de IA generativa se abstraen en **Flujos de Genkit**, ubicados en `/src/ai/flows/`.
-   Cada flujo define sus esquemas de entrada y salida utilizando **Zod**, asegurando que todos los datos pasados hacia y desde la IA estén fuertemente tipados y estructurados.
-   El sistema de modelos de IA es altamente adaptable y soporta múltiples motores de generación, configurados a través del Panel de Administración.

### Esquema de la Base de Datos (Firestore)

-   `users`: Almacena perfiles de usuario públicos, preferencias (incluidas claves de API personales), roles y estadísticas.
-   `characters`: La colección principal. Almacena todos los datos de personajes generados, incluyendo el prompt, biografía, URLs de imágenes, ID del propietario, información de versionado y estado de compartición. La estructura de datos está modularizada en sub-objetos (`core`, `visuals`, `meta`, etc.).
-   `datapacks`: Contiene las definiciones de los DataPacks, incluyendo su nombre, descripción y el objeto `schema` crucial que dicta cómo se comporta el asistente de generación.
-   `ai_models`: Contiene definiciones para modelos de IA y LoRAs de todo el sistema y específicos del usuario.
-   `storyCasts`: Almacena "elencos" creados por el usuario (colecciones de IDs de personajes) utilizados por el Lore Forge.

---

## Scripts Clave

-   `npm run dev`: Inicia el servidor de desarrollo.
-   `npm run build`: Crea una compilación de producción de la aplicación.
-   `npm run firebase:setup`: Valida la configuración de tu archivo `.env`.
-   `npm run datapacks:seed`: Siembra la base de datos de Firestore con los DataPacks locales ubicados en `/data/datapacks/`.
-   `npm run admin:grant -- <uid>`: Otorga el rol de administrador a un usuario. (Usa `--` antes del UID).
-   `npm run admin:list`: Lista todos los usuarios con el rol de administrador.
-   `npm run tags:fetch`: Obtiene y procesa un conjunto de tags de Danbooru para usarlos en el asistente de tags.
