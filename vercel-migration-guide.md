# 🚀 Guía Completa de Migración: De Firebase a Vercel + Supabase y Vercel Blob

¡Felicidades por dar el siguiente paso! Esta guía te llevará de la mano a través de todo el proceso para migrar CharaForge desde su configuración actual en Firebase a una arquitectura moderna y altamente rentable en **Vercel** (para el hosting y almacenamiento de archivos) y **Supabase** (para el backend de base de datos y autenticación).

**Objetivo Final:** Desplegar una versión 100% funcional de CharaForge en Vercel, utilizando Supabase para la autenticación y base de datos, y **Vercel Blob** para el almacenamiento de archivos.

---

## 🗺️ Fases de la Migración

El proceso se divide en 4 fases principales. Sigue cada paso en orden para una transición segura y sin problemas.

1.  **Fase 1: Preparación y Configuración de Cuentas**
2.  **Fase 2: Migración de la Base de Datos (¡Ahora Automatizada!)**
3.  **Fase 3: Refactorización del Código de la Aplicación (Completado)**
4.  **Fase 4: Despliegue y Pruebas Finales**

---

## ✅ Fase 1: Preparación y Configuración de Cuentas

Aquí prepararemos el terreno para la migración.

### Paso 1.1: Crear un Proyecto en Supabase

Supabase será nuestro nuevo backend para la base de datos y la autenticación.

1.  **Regístrate en [Supabase](https://supabase.com/)**: Usa tu cuenta de GitHub para que la integración sea más sencilla.
2.  **Crea una Nueva Organización**: Dale un nombre, como "CharaForge Projects".
3.  **Crea un Nuevo Proyecto**:
    *   Dale un nombre (ej. `charaforge-prod`).
    *   Genera una contraseña segura para la base de datos y guárdala en un lugar seguro.
    *   Elige una región cercana a tus usuarios.
    *   Haz clic en "Create new project".

### Paso 1.2: Configurar Variables de Entorno (¡Aquí están tus llaves!)

Ahora, le diremos a Vercel y a tu entorno local cómo hablar con Supabase y con las APIs de IA.

1.  **Ve a tu Panel de Supabase**:
    *   Navega a tu proyecto en [Supabase](https://supabase.com/).
    *   En el menú de la izquierda, haz clic en **Settings** (el icono del engranaje).
    *   Selecciona la sección **API**.

2.  **Encuentra tus Claves**: Verás una sección llamada **Project API Keys**. Aquí están las tres claves que necesitas.

3.  **Crea tu archivo `.env.local`**: En la raíz del proyecto, crea un archivo llamado `.env.local` y añade lo siguiente, reemplazando los valores con tus claves:

    ```ini
    # .env.local - Claves de Supabase
    NEXT_PUBLIC_SUPABASE_URL="tu-url-de-supabase-aqui"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anon-publica-aqui"
    SUPABASE_SERVICE_ROLE_KEY="tu-clave-service-role-secreta-aqui" # ¡MANTENER SECRETA!

    # Clave de Vercel Blob (la crearás en Vercel, déjala vacía por ahora)
    BLOB_READ_WRITE_TOKEN=""

    # Claves de APIs de IA (Opcionales pero recomendadas)
    GEMINI_API_KEY="tu-clave-de-google-gemini"
    # Añade otras claves como HUGGING_FACE_API_KEY si las necesitas
    ```

---

## ✅ Fase 2: Migración de la Base de Datos (¡Ahora Automatizada!)

Usaremos la **Supabase CLI** para gestionar el esquema de nuestra base de datos de forma automática y profesional. Esto asegura que tu entorno local y el de producción estén siempre sincronizados.

### Paso 2.1: Instala la Supabase CLI

Abre una terminal en tu ordenador y ejecuta el siguiente comando (necesitarás [Node.js](https://nodejs.org/en) instalado):
```bash
npm install supabase --save-dev
```

### Paso 2.2: Conecta tu Proyecto Local a Supabase

1.  **Inicializa Supabase en tu Proyecto (¡Paso Importante!):**
    *   Este comando crea la carpeta `supabase` necesaria para las migraciones.

    ```bash
    npx supabase init
    ```

2.  **Inicia sesión**:
    ```bash
    npx supabase login
    ```
    Esto te pedirá un Token de Acceso, que puedes generar desde tu [dashboard de Supabase](https://supabase.com/dashboard/account/tokens).

3.  **Vincula tu proyecto**: Navega a la carpeta de tu proyecto en la terminal y ejecuta:
    ```bash
    npx supabase link --project-ref [TU_PROJECT_ID]
    ```
    Reemplaza `[TU_PROJECT_ID]` con el ID que aparece en la URL de tu proyecto de Supabase (ej. `https://supabase.com/dashboard/project/[TU_PROJECT_ID]`).

### Paso 2.3: Crea las Tablas en tu Base de Datos (El Paso Mágico)

Ahora que tu proyecto está vinculado, puedes "empujar" el esquema inicial que hemos preparado a tu base de datos de Supabase. **Este comando creará automáticamente todas las tablas, columnas y políticas de seguridad.**

Ejecuta el siguiente comando en tu terminal:
```bash
npm run supabase:db:push
```
¡Listo! La CLI leerá el archivo de migración que hemos creado en `supabase/migrations` y configurará tu base de datos remota. ¡Con esto, tu base de datos está 100% lista!

---

## ✅ Fase 3: Refactorización del Código

Esta fase ya está completada. Todo el código de la aplicación ha sido refactorizado para usar Supabase y Vercel Blob.

---

## ✅ Fase 4: Despliegue y Pruebas Finales

¡Es la hora de la verdad!

### Paso 4.1: Sube tu Código a GitHub

Asegúrate de que todos los cambios que hemos hecho estén guardados y subidos a tu repositorio de GitHub.

### Paso 4.2: Despliega en Vercel

1.  **Conecta tu Repositorio**: Ve a tu [dashboard de Vercel](https://vercel.com/new) y crea un nuevo proyecto importando el repositorio de CharaForge desde GitHub.
2.  **Configura las Variables de Entorno**: Vercel detectará que es un proyecto Next.js. Antes de desplegar, ve a la configuración del proyecto > **Settings** > **Environment Variables**. Añade **exactamente las mismas claves** que pusiste en tu archivo `.env.local`.
3.  **Configura Vercel Blob**:
    *   En el dashboard de tu proyecto de Vercel, ve a la pestaña **Storage**.
    *   Crea un nuevo "Blob Store" y conéctalo a tu proyecto.
    *   Vercel generará automáticamente un **token de lectura/escritura**. Copia este token.
    *   Vuelve a **Settings** > **Environment Variables** y crea una nueva variable llamada `BLOB_READ_WRITE_TOKEN`, pegando el token que acabas de copiar.
4.  **Inicia el Despliegue**: Haz clic en el botón "Deploy".

### Paso 4.3: ¡Prueba tu Aplicación!

Vercel te dará una URL para tu aplicación desplegada. Visítala y prueba todo:
*   Registro de un nuevo usuario.
*   Inicio de sesión.
*   Generación de un personaje.
*   Guardado del personaje en tu galería (esto probará la subida a Vercel Blob).
*   Exploración de las galerías públicas.

¡Y eso es todo! Has migrado y desplegado con éxito CharaForge a un stack moderno, escalable y profesional.
