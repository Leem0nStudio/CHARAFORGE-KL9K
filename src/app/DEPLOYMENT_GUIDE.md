# 🚀 Guía de Despliegue y Arquitecturas Alternativas

Este documento detalla los recursos y pasos necesarios para desplegar CharaForge en plataformas alternativas como **Vercel**, centrándose en opciones con capas gratuitas robustas y generosas.

---

## 🏛️ Arquitectura Actual: Firebase

*   **Hosting**: Firebase Hosting
*   **Autenticación**: Firebase Authentication
*   **Base de Datos**: Firestore (NoSQL)
*   **Almacenamiento de Archivos**: Firebase Storage
*   **Funciones de Backend**: Cloud Functions for Firebase

**Ventaja Principal**: Integración perfecta y un ecosistema unificado.
**Consideración**: Puede volverse costoso si se superan los límites de la capa gratuita ("Spark").

---

## 💎 Arquitectura Alternativa Recomendada: Vercel + Supabase

Esta es una de las combinaciones más potentes y rentables para aplicaciones Next.js modernas.

*   **Hosting**: **Vercel**. El mejor en su clase para Next.js, con un plan gratuito extremadamente generoso.
*   **Backend Unificado (Auth, DB, Storage)**: **Supabase**. A menudo llamado "la alternativa de código abierto a Firebase", ofrece una base de datos Postgres, autenticación, almacenamiento y funciones, todo en una plataforma con una excelente capa gratuita.

**Ventaja Principal**: Costo-efectividad, herramientas modernas para desarrolladores y control sobre una base de datos relacional (SQL).

---

## 🗺️ Mapa de Migración: Firebase a Vercel/Supabase

Aquí tienes una comparación detallada y el esfuerzo que implicaría migrar cada servicio:

| Recurso de CharaForge | Alternativa Gratuita Recomendada | Nivel de Esfuerzo de Migración | Notas Clave |
| :-------------------- | :-------------------------------- | :----------------------------- | :---------- |
| **Hosting Next.js**   | ✅ **Vercel**                     | **Bajo**                       | Despliegue casi automático desde un repositorio de Git. Es la mejor opción para Next.js. |
| **Firebase Auth**     | ✅ **Supabase Auth**              | **Medio**                      | Supabase Auth es muy completo. Requeriría reescribir la lógica de `use-auth.tsx` para usar el cliente de Supabase y `verifyAndGetUid` para validar tokens JWT de Supabase en el servidor. |
| **Firestore (NoSQL)** | ✅ **Supabase (Postgres)**        | **Alto**                       | Este es el mayor cambio. Se necesita definir un esquema de base de datos SQL para tus colecciones (users, characters, etc.) y reescribir todas las consultas de Firestore para usar un cliente de Postgres (como el SDK de Supabase). Aunque es un esfuerzo, ofrece la potencia de SQL. |
| **Firebase Storage**  | ✅ **Supabase Storage**           | **Bajo**                       | El concepto es casi idéntico. Solo se necesita cambiar las llamadas en `services/storage.ts` para usar el SDK de Supabase Storage en lugar del de Firebase. La lógica de subida y obtención de URLs es muy similar. |
| **Cloud Functions**   | ✅ **Vercel Functions** / **Edge** | **Medio**                      | La lógica de las funciones de Firebase (`src/functions`) se puede migrar a Vercel Functions. Se ejecutan en el mismo entorno de Node.js, por lo que la mayor parte del código de procesamiento de imágenes se puede reutilizar. El cambio principal está en la forma en que se definen y despliegan. |
| **Genkit / Gemini API** | ✅ **Compatible**                 | **Ninguno**                    | La IA se consume a través de APIs, por lo que solo necesitas añadir tus claves (`GEMINI_API_KEY`, etc.) como **Variables de Entorno** en la configuración de tu proyecto de Vercel. No se requiere ningún cambio en el código de Genkit. |

### Conclusión y Recomendación

Migrar de Firebase es totalmente factible y la combinación **Vercel + Supabase** es una opción fantástica y una de las más populares en la comunidad de desarrolladores por una buena razón.

*   **Si buscas la ruta de migración más cohesiva**, Supabase es tu mejor opción, ya que replica casi todo el conjunto de herramientas de Firebase en un solo lugar.
*   **El mayor desafío técnico será la migración de la base de datos de Firestore (NoSQL) a Postgres (SQL)**. Esto requiere planificación, pero te dará a cambio las ventajas de una base de datos relacional.
*   Para un **desarrollo local rápido sin cambiar de stack**, los **emuladores de Firebase** (`npm run firebase:emulators`) siguen siendo la opción más eficiente, ya que no requieren ningún cambio en el código.

Espero que esta guía detallada te sea de gran ayuda para analizar tus opciones y tomar la mejor decisión para el futuro de CharaForge.
