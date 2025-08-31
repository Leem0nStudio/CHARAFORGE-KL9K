
# 🏛️ Arquitectura del Sistema de DataPacks Dinámicos

Este documento proporciona una explicación técnica detallada del funcionamiento interno del sistema de DataPacks de CharaForge, con un enfoque en cómo se procesan los archivos de comodines de la comunidad (wildcards) para generar una interfaz de usuario dinámica y prompts complejos.

---

## 🎯 Filosofía del Diseño

El sistema está diseñado para resolver un problema clave: cómo aprovechar la enorme cantidad de contenido de los archivos de comodines de la comunidad (utilizados en herramientas como A1111) y hacerlos compatibles con un sistema de asistente visual estructurado.

La solución fue crear un sistema de **análisis y renderizado dinámico** que se adapta al contenido del archivo importado, en lugar de forzar al usuario a adaptar sus archivos a un esquema rígido.

## 🌊 Flujo de Datos Completo: De Archivo a Prompt

El proceso se puede dividir en tres fases principales:

1.  **Importación y Análisis (Backend)**
2.  **Renderizado de la Interfaz (Frontend Dinámico)**
3.  **Ensamblaje del Prompt (Lógica del Cliente)**

---

### 1. Importación y Análisis (`/src/app/actions/datapacks.ts`)

Esta es la primera etapa y ocurre en el servidor cuando un usuario importa un archivo.

**Inputs:**
*   Un archivo `.zip`, `.yaml` o `.txt` proporcionado por el usuario.
*   Un nombre para el nuevo DataPack.

**Proceso (`buildSchemaFromFiles`):**

1.  **Lectura y Consolidación:** El sistema descomprime el `.zip` (si aplica) y lee el contenido de todos los archivos `.yaml` y `.txt`. Usa la librería `js-yaml` para convertir todo este contenido en un único objeto JavaScript.
2.  **Aplanamiento Recursivo:** Una función recursiva (`processNode`) recorre este objeto. Su misión es "aplanar" la estructura anidada del archivo de comodines en un formato que nuestro sistema pueda entender.
    *   **Ejemplo de Aplanamiento:** Una estructura como `clothings -> female -> upper-body` en el YAML se convierte en una clave única: `clothings_female_upper-body`.
3.  **Diferenciación de Contenido:**
    *   **Slots de Opciones:** Si un nodo en el YAML contiene una lista de strings simples (ej. `upper-body: ["Blazer", "Hoodie", ...]`), la función lo identifica como un **slot de opciones**. Convierte cada string en un objeto `{ label: "Valor", value: "Valor" }` y lo asigna a la clave aplanada (ej. `clothings_female_upper-body`) dentro del `characterProfileSchema`.
    *   **Plantillas de Prompts:** Si un nodo contiene una lista de strings que a su vez contienen la sintaxis de comodín `__...__` (ej. `BoChars/female/modern:`), la función lo identifica como una **plantilla de prompt**. Lo convierte en un objeto `{ name: "...", template: "..." }` y lo añade al array `promptTemplates`.
4.  **Validación con Zod:** El objeto `DataPackSchema` resultante se valida contra nuestro `DataPackSchemaSchema` de Zod para asegurar la integridad estructural antes de guardarlo.

**Output:**
*   Un nuevo documento en la colección `datapacks` de Firestore. Este documento contiene un `schema` completamente estructurado y listo para ser consumido por la interfaz.

---

### 2. Renderizado de la Interfaz (`/src/app/admin/datapacks/[id]/datapack-schema-editor.tsx`)

Esta fase ocurre en el lado del cliente, cuando un administrador edita un DataPack importado.

**Input:**
*   El objeto `DataPack` cargado desde Firestore.

**Proceso (`DynamicSlotEditor`):**

1.  **Adiós al Editor Estático:** El componente ya no tiene secciones de UI predefinidas como "Apariencia" o "Equipamiento".
2.  **Lectura del Esquema:** El componente accede al objeto `characterProfileSchema` del DataPack que se está editando.
3.  **Renderizado Dinámico:** Itera sobre **todas las claves** de `characterProfileSchema`. Por cada clave que encuentra (ej. `clothings_female_upper-body`), dinámicamente:
    *   Crea un `AccordionItem` (un panel desplegable).
    *   Usa el nombre de la clave como título del panel (formateado para ser legible, ej. "Clothings Female Upper Body").
    *   Dentro del panel, renderiza un `OptionEditor` que muestra la lista de opciones para ese slot, permitiendo al usuario añadir, editar o eliminar ítems.
4.  **Aislamiento:** Cada slot se gestiona de forma independiente, lo que garantiza que la interfaz sea un reflejo 1:1 del contenido del archivo importado.

**Output:**
*   Una interfaz de edición de DataPacks totalmente dinámica y generada a medida, que permite al usuario gestionar el contenido de su archivo importado.

---

### 3. Ensamblaje del Prompt (`/src/components/datapack-selector.tsx` y `/src/components/character-generator.tsx`)

Esta es la fase final, donde el usuario utiliza el DataPack en el **Asistente de Generación**.

**Inputs:**
*   El DataPack seleccionado por el usuario.
*   Las opciones elegidas por el usuario en la interfaz del asistente.
*   La plantilla de prompt seleccionada por el usuario.

**Proceso (`DataPackWizard` y `handleWizardComplete`):**

1.  **Selección del Usuario:** El usuario navega por la interfaz del asistente (que también se renderiza dinámicamente como el editor) y selecciona una opción para cada slot. Estas selecciones se guardan en el estado del formulario de React Hook Form.
2.  **Elección de Plantilla:** El usuario elige una de las plantillas de prompt disponibles en el desplegable superior (ej. "Full Body Scene").
3.  **Activación del Ensamblaje:** Al hacer clic en "Generate Prompt", se llama a la función `handleWizardComplete`.
4.  **Reemplazo de Comodines:** Esta función ejecuta la lógica de reemplazo:
    *   Obtiene la cadena de la plantilla seleccionada (ej. `__person/female__ wearing __clothings/female-attire__`).
    *   Usa una expresión regular (`/__([\\w\\/]+)__/g`) para encontrar todos los placeholders del tipo `__...__`.
    *   Para cada placeholder encontrado (ej. `__person/female__`):
        a.  Extrae el nombre del comodín (`person/female`).
        b.  Lo convierte a la clave del formulario (`person_female`).
        c.  Busca el valor que el usuario seleccionó para `person_female` en los datos del formulario.
        d.  Reemplaza el placeholder `__person/female__` con el valor seleccionado.
5.  **Limpieza:** Finalmente, la función realiza una pasada de limpieza para eliminar comas dobles o espacios extra que puedan haber quedado del proceso de reemplazo.

**Output:**
*   Un **prompt de texto final, largo y detallado**, listo para ser enviado al modelo de IA de generación de imágenes.
