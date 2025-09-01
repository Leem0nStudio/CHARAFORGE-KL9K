# 🚀 Tutorial: Integrando RunDiffusion con CharaForge

Esta guía te mostrará cómo conectar tu sesión privada y de alto rendimiento de **RunDiffusion** a CharaForge, permitiéndote usar tu propio servidor como un motor de generación de imágenes personalizado.

**Nota Importante:** La integración actual de CharaForge está optimizada para sesiones de RunDiffusion que utilizan la interfaz de **ComfyUI**.

---

## 🎯 ¿Cuál es el Objetivo?

Vamos a configurar un modelo en CharaForge para que envíe las solicitudes de generación de imágenes directamente a tu servidor privado de RunDiffusion. Esto te da acceso a la velocidad, la privacidad y los modelos personalizados de tu sesión de RunDiffusion, todo desde la comodidad de la interfaz de CharaForge.

---

## Paso 1: Lanza tu Sesión de RunDiffusion

1.  **Inicia Sesión en RunDiffusion:** Ve a [rundiffusion.com](https://rundiffusion.com) y lanza una nueva sesión de servidor.
2.  **Elige ComfyUI:** Al configurar tu sesión, asegúrate de seleccionar una plantilla o tipo de servidor que utilice la interfaz **ComfyUI**.
3.  **Obtén tu URL:** Una vez que tu sesión esté activa, RunDiffusion te proporcionará una URL única para acceder a ella. Se verá algo así:
    ```
    https://tu-nombre-de-sesion.rundiffusion.com
    ```
    Esta URL es la clave para la integración. ¡Cópiala!

---

## Paso 2: Prepara tu Flujo de Trabajo en ComfyUI

Antes de conectar CharaForge, necesitas un flujo de trabajo (workflow) que la aplicación pueda usar.

1.  **Abre tu ComfyUI:** Accede a tu sesión de RunDiffusion usando la URL del paso anterior. Verás la interfaz de ComfyUI.
2.  **Crea o Carga un Flujo de Trabajo:** Puedes usar el flujo de trabajo que viene por defecto (un simple "texto a imagen") o crear uno más complejo. Lo importante es que tenga un nodo de entrada de texto (`CLIPTextEncode`) para el prompt positivo.
3.  **Guarda el Flujo en Formato API:** Una vez que tu flujo esté listo, busca y haz clic en el botón **"Save (API Format)"**. Esto descargará un archivo JSON a tu ordenador.
4.  **Copia el Contenido del JSON:** Abre el archivo JSON que acabas de descargar con un editor de texto (como el Bloc de Notas, VS Code, etc.) y copia *todo* su contenido.

---

## Paso 3: Configura el Modelo en CharaForge

Ahora, vamos a decirle a CharaForge cómo hablar con tu servidor.

1.  **Ve al Panel de Administración:** En CharaForge, navega a `Panel de Administración` -> `AI Models`.
2.  **Crea un Nuevo Modelo:** Haz clic en el botón `Add New...`.
3.  **Rellena el Formulario:**
    *   **Name:** Dale un nombre descriptivo, como "Mi Servidor RunDiffusion" o "EpicRealism en RD".
    *   **Type:** `Base Model`.
    *   **Orchestration Engine:** Selecciona `RunDiffusion` (o `ComfyUI`, ya que usan el mismo motor de conexión).
    *   **Server URL:** Pega aquí la URL de tu sesión de RunDiffusion del Paso 1, pero **asegúrate de añadir `/prompt` al final**. Debería verse así:
        ```
        https://tu-nombre-de-sesion.rundiffusion.com/prompt
        ```
    *   **Default Base Model Filename:** Este campo es muy importante. Escribe el nombre exacto del archivo del modelo (checkpoint) que tu flujo de trabajo de ComfyUI está usando por defecto. Por ejemplo:
        ```
        epicrealism_naturalSinRC1.safetensors
        ```
    *   **ComfyUI Workflow (JSON):** Pega aquí el contenido completo del archivo JSON que copiaste en el Paso 2.

4.  **Guarda el Modelo:** Haz clic en `Add Manually` o `Save Changes`.

---

## ¡Listo para Forjar!

¡Felicidades! Has integrado con éxito tu servidor privado de RunDiffusion.

Ahora, cuando vayas al **Generador de Personajes** y selecciones el modelo que acabas de crear ("Mi Servidor RunDiffusion"), todas las solicitudes de generación de imágenes se enviarán directamente a tu sesión de RunDiffusion, aprovechando su potencia y tus modelos personalizados.