# 🚀 Guía Completa de Migración: De Firebase a Vercel + Supabase

¡Felicidades por dar el siguiente paso! Esta guía te llevará de la mano a través de todo el proceso para migrar CharaForge desde su configuración actual en Firebase a una arquitectura moderna y altamente rentable en **Vercel** (para el hosting) y **Supabase** (para el backend).

**Objetivo Final:** Desplegar una versión 100% funcional de CharaForge en Vercel, utilizando Supabase para la autenticación, base de datos y almacenamiento, aprovechando al máximo sus generosas capas gratuitas.

---

## 🗺️ Fases de la Migración

El proceso se divide en 4 fases principales. Sigue cada paso en orden para una transición segura y sin problemas.

1.  **Fase 1: Preparación y Configuración de Cuentas**
2.  **Fase 2: Migración de la Base de Datos (El Paso Crítico)**
3.  **Fase 3: Refactorización del Código de la Aplicación**
4.  **Fase 4: Despliegue y Pruebas Finales**

---

## ✅ Fase 1: Preparación y Configuración de Cuentas

Aquí prepararemos el terreno para la migración.

### Paso 1.1: Crear un Proyecto en Supabase

Supabase será nuestro nuevo backend "todo en uno".

1.  **Regístrate en [Supabase](https://supabase.com/)**: Usa tu cuenta de GitHub para que la integración sea más sencilla.
2.  **Crea una Nueva Organización**: Dale un nombre, como "CharaForge Projects".
3.  **Crea un Nuevo Proyecto**:
    *   Dale un nombre (ej. `charaforge-prod`).
    *   Genera una contraseña segura para la base de datos y guárdala en un lugar seguro.
    *   Elige una región cercana a tus usuarios.
    *   Haz clic en "Create new project".

### Paso 1.2: Crear un Proyecto en Vercel

Vercel alojará nuestra aplicación Next.js.

1.  **Regístrate en [Vercel](https://vercel.com/)**: Usa tu cuenta de GitHub.
2.  **Crea un Nuevo Proyecto**:
    *   Haz clic en "Add New..." > "Project".
    *   Importa tu repositorio de GitHub de CharaForge.
    *   Vercel detectará que es un proyecto Next.js y configurará los ajustes de build automáticamente. **¡No lo despliegues todavía!**

### Paso 1.3: Configurar Variables de Entorno (¡Aquí están tus llaves!)

Ahora, le diremos a Vercel y a tu entorno local cómo hablar con Supabase.

1.  **Ve a tu Panel de Supabase**:
    *   Navega a tu proyecto en [Supabase](https://supabase.com/).
    *   En el menú de la izquierda, haz clic en **Settings** (el icono del engranaje).
    *   Selecciona la sección **API**.

2.  **Encuentra tus Claves**: Verás una sección llamada **Project API Keys**. Aquí están las tres claves que necesitas.

3.  **Configura las Variables**:
    *   **En Vercel**: Ve a la configuración de tu proyecto > **Settings** > **Environment Variables**.
    *   **En tu PC (Local)**: Crea un archivo `.env.local` en la raíz de tu proyecto.

    Añade las siguientes variables en **ambos lugares** (Vercel y tu archivo `.env.local`):

    *   `NEXT_PUBLIC_SUPABASE_URL`
        *   **Valor:** Copia la **URL del Proyecto** desde el panel de API de Supabase.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   **Valor:** Copia la clave `anon` `public` desde la sección "Project API Keys".
    *   `SUPABASE_SERVICE_ROLE_KEY`
        *   **Valor:** Copia la clave `service_role` `secret`. **¡Esta es muy importante y debe mantenerse secreta!**

    Tu archivo `.env.local` debería verse así:
    ```ini
    # .env.local
    NEXT_PUBLIC_SUPABASE_URL="tu-url-de-supabase-aqui"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-clave-anon-publica-aqui"
    SUPABASE_SERVICE_ROLE_KEY="tu-clave-service-role-secreta-aqui"
    ```

---

## ✅ Fase 2: Migración de la Base de Datos (El Paso Crítico)

Esta es la parte más delicada. Usaremos la **Supabase CLI** para gestionar el esquema de nuestra base de datos. Este es el método profesional que nos asegura que nuestro entorno local y el de producción (Vercel/Supabase) estén siempre sincronizados.

### Paso 2.1: Instala la Supabase CLI

Abre una terminal en tu ordenador y ejecuta el siguiente comando (necesitarás [Node.js](https://nodejs.org/en) instalado):
```bash
npm install supabase --save-dev
```
Esto añade la CLI a tu proyecto.

### Paso 2.2: Conecta tu Proyecto Local a Supabase

1.  **Inicia sesión**:
    ```bash
    npx supabase login
    ```
    Esto te pedirá un Token de Acceso, que puedes generar desde tu [dashboard de Supabase](https://supabase.com/dashboard/account/tokens).

2.  **Vincula tu proyecto**: Navega a la carpeta de tu proyecto en la terminal y ejecuta:
    ```bash
    npx supabase link --project-ref [TU_PROJECT_ID]
    ```
    Reemplaza `[TU_PROJECT_ID]` con el ID que aparece en la URL de tu proyecto de Supabase (ej. `https://supabase.com/dashboard/project/[TU_PROJECT_ID]`).

### Paso 2.3: Aplica la Migración Inicial

Ahora que tu proyecto está vinculado, puedes "empujar" el esquema inicial que hemos preparado en el archivo `supabase/migrations/20240901000000_initial_schema.sql` a tu base de datos de Supabase remota.

Ejecuta el siguiente comando:
```bash
npx supabase db push
```
La CLI leerá el archivo de migración y creará las tablas `users` y `characters`, además de las políticas de seguridad, en tu base de datos de Supabase. ¡Con esto, tu base de datos remota está lista!

---

## ✅ Fase 3: Refactorización del Código

Ahora, adaptaremos el código de CharaForge para que use Supabase en lugar de Firebase.

### Paso 3.1: Cliente de Supabase

Crea un archivo en `src/lib/supabase/client.ts` para inicializar el cliente de Supabase para el navegador.

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Paso 3.2: Reemplazar la Lógica de Autenticación

Edita `src/hooks/use-auth.tsx` para usar Supabase.

*   Reemplaza las llamadas a `firebase/auth` con las del cliente de Supabase (`@supabase/auth-helpers-nextjs` o similar).
*   El flujo de inicio de sesión ahora llamará a `supabase.auth.signInWithPassword()` en lugar de a Firebase.
*   La gestión de la sesión se simplifica, ya que la librería de Supabase maneja las cookies automáticamente.

### Paso 3.3: Reemplazar las Acciones del Servidor

Esta es la parte más grande de la refactorización. Deberás repasar cada archivo en `src/app/actions/` y cambiar las llamadas de Firestore por las del SDK de Supabase.

**Ejemplo de cambio en `character-read.ts`:**

```typescript
// ANTES (Firebase)
import { adminDb } from '@/lib/firebase/server';
const charactersRef = adminDb.collection('characters');
const snapshot = await charactersRef.where('meta.userId', '==', userId).get();

// DESPUÉS (Supabase)
import { getSupabaseServerClient } from '@/lib/supabase/server';
const supabase = getSupabaseServerClient();

const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId);
```

Tendrás que hacer cambios similares para `saveCharacter`, `getPublicCharacters`, etc.

### Paso 3.4: Migrar el Almacenamiento de Archivos

Edita `src/services/storage.ts` para usar Supabase Storage.

```typescript
// ANTES (Firebase)
import { getStorage } from 'firebase-admin/storage';
const bucket = getStorage().bucket(...);
// ...lógica de subida

// DESPUÉS (Supabase)
import { getSupabaseServerClient } from '@/lib/supabase/server';
const supabase = getSupabaseServerClient();
const { data, error } = await supabase.storage
    .from('character-images') // Nombre de tu bucket en Supabase
    .upload(destinationPath, fileSource);
```

---

## ✅ Fase 4: Despliegue y Pruebas

1.  **Sube tus Cambios a GitHub**: Una vez que hayas refactorizado y probado todo localmente, sube tus cambios a tu repositorio.
2.  **Despliega en Vercel**: Ve a tu proyecto de Vercel. Como ya está conectado a tu repo, detectará los nuevos cambios. Inicia un nuevo despliegue.
3.  **Verifica**: Vercel te dará una URL de vista previa. Úsala para probar todas las funcionalidades:
    *   Registro e inicio de sesión.
    *   Creación y guardado de personajes.
    *   Visualización de galerías públicas.
4.  **Promociona a Producción**: Si todo funciona, ¡promociona tu despliegue a producción!

¡Y eso es todo! Has migrado con éxito CharaForge a una arquitectura más escalable y potencialmente más económica. ¡Felicidades!
