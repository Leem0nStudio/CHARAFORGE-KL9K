# 🚀 Tutorial: Desplegando tu Worker de Python Profesional con Cloud Run

¡Felicidades! Has decidido dar el salto a una arquitectura de backend serverless y robusta. Esta guía te mostrará cómo desplegar el worker de procesamiento de imágenes (`/src/image-worker`) como un servicio de **Google Cloud Run**.

**El Objetivo:** Crear un servicio totalmente automático que se active cada vez que subes una imagen a la carpeta `raw-uploads/` de tu Firebase Storage, la procese y actualice tu base de datos, todo sin que tengas que ejecutar un script manualmente.

---

### Prerrequisitos

1.  **Google Cloud CLI Instalada:** Asegúrate de tener la [herramienta de línea de comandos `gcloud`](https://cloud.google.com/sdk/docs/install) instalada y configurada en tu máquina.
2.  **Facturación Habilitada:** Cloud Run, Cloud Build y otros servicios requieren que la facturación esté habilitada en tu proyecto de Google Cloud.
3.  **APIs Habilitadas:** Necesitarás habilitar las APIs de Cloud Run y Cloud Build. `gcloud` a menudo te pedirá que las habilites si no lo están.

---

### Paso 1: Configurar los Secretos en Google Secret Manager

Tu worker necesita una clave para acceder a Firebase. La forma más segura de proporcionársela es a través de Secret Manager.

1.  **FIREBASE_SERVICE_ACCOUNT_KEY:**
    *   Ve a la [página de Secret Manager](https://console.cloud.google.com/security/secret-manager).
    *   Haz clic en **"Crear Secreto"**.
    *   **Nombre del secreto:** `FIREBASE_SERVICE_ACCOUNT_KEY`
    *   **Valor del secreto:** Pega aquí el contenido **completo** de tu archivo JSON de clave de servicio de Firebase. Debe ser una sola línea.
    *   Haz clic en **"Crear secreto"**.

---

### Paso 2: Desplegar el Servicio en Cloud Run

Ahora vamos a desplegar el código del worker. Abre una terminal y navega hasta la raíz de tu proyecto de CharaForge.

1.  **Ejecuta el Comando de Despliegue:**
    Copia y pega el siguiente comando en tu terminal. **Asegúrate de reemplazar `[YOUR_PROJECT_ID]` por tu ID de proyecto de Google Cloud.**

    ```bash
    gcloud run deploy image-processing-worker \
      --source ./src/image-worker \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="STORAGE_BUCKET=[YOUR_PROJECT_ID].appspot.com" \
      --set-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest" \
      --project [YOUR_PROJECT_ID]
    ```

    **¿Qué hace este comando?**
    *   `gcloud run deploy ...`: Inicia el proceso de despliegue en Cloud Run.
    *   `--source ./src/image-worker`: Le dice a `gcloud` que el código fuente está en la carpeta que hemos creado. Automáticamente usará el `Dockerfile` que hay dentro.
    *   `--platform managed`: Especifica que estamos usando el entorno serverless gestionado por Google.
    *   `--region us-central1`: Elige la región donde se desplegará el servicio (puedes cambiarla si lo necesitas).
    *   `--allow-unauthenticated`: Esto es necesario para que el disparador de Storage pueda invocar el servicio.
    *   `--set-env-vars`: Configura la variable de entorno para el nombre de tu bucket de Storage.
    *   `--set-secrets`: Conecta de forma segura el secreto que creamos en el Paso 1 a la variable de entorno que el script de Python espera.
    *   `--project`: Especifica el ID de tu proyecto.

2.  **Espera a que termine el despliegue.** La primera vez puede tardar unos minutos, ya que Google Cloud Build tiene que construir la imagen del contenedor.

---

### Paso 3: Crear el Disparador (Trigger) de Eventarc

El servicio ya está desplegado, pero necesitamos decirle a Google Cloud que lo ejecute cuando se suba una imagen.

1.  **Obtén la URL del Servicio:** Una vez que el despliegue del Paso 2 termine, la terminal te mostrará una **URL del Servicio**. Cópiala, la necesitarás.

2.  **Crea el Disparador:** Ejecuta el siguiente comando en tu terminal, reemplazando los valores entre `[]`:

    ```bash
    gcloud eventarc triggers create process-image-trigger \
      --destination-run-service=image-processing-worker \
      --destination-run-region=us-central1 \
      --location=us-central1 \
      --event-filters="type=google.cloud.storage.object.v1.finalized" \
      --event-filters="bucket=[YOUR_PROJECT_ID].appspot.com" \
      --service-account="[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
      --project [YOUR_PROJECT_ID]
    ```
    *   **`--destination-run-service`**: El nombre que le dimos a nuestro servicio en el paso anterior (`image-processing-worker`).
    *   **`--event-filters`**: Aquí está la magia. Le decimos que se dispare con el evento `object.v1.finalized` (un archivo nuevo) en el `bucket` especificado.
    *   **`--service-account`**: Necesitas proporcionar la cuenta de servicio de **Compute Engine por defecto**. Puedes encontrar tu número de proyecto (`[YOUR_PROJECT_NUMBER]`) en la página principal de la consola de Google Cloud.

---

### ¡Listo!

¡Eso es todo! Ahora tienes un pipeline de procesamiento de nivel de producción, totalmente automático y serverless.

**Para probarlo:**
1.  Ve a tu aplicación CharaForge.
2.  Ve a la galería de un personaje.
3.  Haz clic en "Process" para una imagen.
4.  Observa en la consola de Google Cloud Run cómo se inicia una nueva ejecución de tu servicio `image-processing-worker` y procesa la imagen.

¡Felicidades, Forjador! Has dominado una pieza clave de la arquitectura de backend moderna.
