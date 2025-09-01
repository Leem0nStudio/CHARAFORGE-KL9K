
# 🛠️ Solucionando el Error "PERMISSION_DENIED" de Eventarc

¡No te preocupes! Este es un error de configuración muy común y tiene una solución directa. Ocurre porque el servicio de Google Cloud que crea los "disparadores" (Eventarc) necesita permiso explícito para acceder a otros servicios (como Cloud Storage y Cloud Run).

Sigue estos pasos para otorgar los permisos necesarios de forma permanente.

---

### Contexto: ¿Qué está pasando?

Cuando creas un disparador, le pides a Eventarc que use una "cuenta de servicio" para actuar en tu nombre. Por defecto, intenta usar la **cuenta de servicio de Compute Engine**. Este error significa que a esa cuenta le faltan los permisos para:
1.  Recibir eventos de Cloud Storage.
2.  Invocar (ejecutar) tu servicio de Cloud Run.

Vamos a concederle esos permisos.

---

### Paso 1: Habilitar las APIs Necesarias

Primero, asegúrate de que todas las APIs relevantes estén habilitadas en tu proyecto. Copia y pega este comando en tu terminal:

```bash
gcloud services enable eventarc.googleapis.com pubsub.googleapis.com run.googleapis.com storage.googleapis.com
```

Esto asegura que todos los componentes puedan comunicarse entre sí.

---

### Paso 2: Otorgar los Permisos (Roles de IAM)

Este es el paso más importante. Vamos a otorgar los roles necesarios a la cuenta de servicio de Compute Engine por defecto.

1.  **Copia el siguiente comando.**
2.  **Reemplaza `[YOUR_PROJECT_ID]` y `[YOUR_PROJECT_NUMBER]`** con los valores de tu proyecto (los mismos que usaste antes).

```bash
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
    --member="serviceAccount:[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
    --role="roles/eventarc.eventReceiver"

gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
    --member="serviceAccount:[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
    --role="roles/run.invoker"
```

**¿Qué hacen estos comandos?**

*   El primer comando le da a la cuenta de servicio el rol de `eventarc.eventReceiver`, permitiéndole recibir el evento cuando se sube un archivo a Storage.
*   El segundo comando le da el rol de `run.invoker`, permitiéndole iniciar tu servicio de Cloud Run (`image-processing-worker`).

---

### Paso 3: Reintentar el Comando del Disparador

¡Listo! Ahora que los permisos están configurados correctamente, vuelve a ejecutar el **Comando 2** de la guía de despliegue principal (`TUTORIAL_CLOUD_RUN_DEPLOY.md`).

Este es el comando que debes reintentar:

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

Esta vez, el comando debería completarse con éxito. ¡Con esto, tu pipeline estará 100% operativo!
