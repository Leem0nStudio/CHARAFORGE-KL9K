
# Guía de Configuración: Sistema de Sincronización de Modelos

Esta guía cubre todos los pasos necesarios para configurar el nuevo sistema de sincronización de modelos en un proyecto de CharaForge desde cero.

---

### **Paso 1: Requisitos Previos del Proyecto en Google Cloud**

1.  **Proyecto de Firebase:** Asegúrate de que tu proyecto de CharaForge esté conectado a un proyecto de Firebase.
2.  **Plan de Facturación:** Tu proyecto de Google Cloud debe estar en el plan "Blaze (Pay-as-you-go)". Esto es un requisito de Google para usar Cloud Functions con Node.js 18/20 y la API de Cloud Tasks.

---

### **Paso 2: Variables de Entorno Críticas**

Añade las siguientes variables a tu archivo `.env` para el desarrollo local, y asegúrate de configurarlas también en el entorno de tu aplicación desplegada (p. ej., Vercel, Google App Engine).

```ini
# ID de tu proyecto de Google Cloud (ej: charaforge-12345)
GCLOUD_PROJECT="tu-project-id"

# Región para tus Cloud Functions y Tasks (ej: us-central1)
GCLOUD_LOCATION="us-central1"

# Email de la cuenta de servicio que ejecuta tu app Next.js
# - Si usas App Engine, la encuentras en la consola de GCP > IAM.
# - Suele ser: tu-project-id@appspot.gserviceaccount.com
APP_ENGINE_SERVICE_ACCOUNT="tu-project-id@appspot.gserviceaccount.com"

# Tu clave de API de Civitai
CIVITAI_API_KEY="tu-clave-de-civitai"

# El nombre EXACTO de tu bucket de Google Cloud Storage para los modelos
MODELS_STORAGE_BUCKET="tu-bucket-de-modelos"
```

**Importante:** Estas mismas variables (`CIVITAI_API_KEY` y `MODELS_STORAGE_BUCKET`) también deben estar disponibles para el entorno de ejecución de tus Cloud Functions.

---

### **Paso 3: Crear la Cola de Cloud Tasks**

Abre una terminal con `gcloud` CLI autenticado y ejecuta los siguientes comandos:

1.  **Habilitar la API:**
    ```bash
    gcloud services enable cloudtasks.googleapis.com --project=tu-project-id
    ```
2.  **Crear la Cola:**
    ```bash
    gcloud tasks queues create model-sync-jobs --location=us-central1 --project=tu-project-id
    ```

---

### **Paso 4: Asignar Permisos (IAM)**

Necesitamos asegurarnos de que los servicios tengan permiso para hablar entre sí.

1.  **Permiso para Encolar Tareas:** Dale permiso a tu aplicación web para añadir tareas a la cola.
    ```bash
    gcloud projects add-iam-policy-binding tu-project-id \
      --member="serviceAccount:tu-project-id@appspot.gserviceaccount.com" \
      --role="roles/cloudtasks.enqueuer"
    ```

2.  **Permiso para la Cloud Function:** Dale permiso a tu nueva función para que pueda escribir en Firestore y en el Storage.
    ```bash
    # Permiso para escribir en Cloud Storage
    gcloud projects add-iam-policy-binding tu-project-id \
      --member="serviceAccount:tu-project-id@appspot.gserviceaccount.com" \
      --role="roles/storage.admin"

    # Permiso para escribir en Firestore
    gcloud projects add-iam-policy-binding tu-project-id \
      --member="serviceAccount:tu-project-id@appspot.gserviceaccount.com" \
      --role="roles/datastore.user"
    ```
    *(Nota: Reemplaza `tu-project-id@appspot.gserviceaccount.com` si tu función usa una cuenta de servicio diferente).*

---

### **Paso 5: Despliegue**

1.  **Instalar Dependencias de las Funciones:**
    ```bash
    cd src/functions
    npm install
    cd ../..
    ```
2.  **Desplegar las Funciones:**
    ```bash
    firebase deploy --only functions
    ```
3.  **Desplegar tu Aplicación Next.js:** Despliega la aplicación principal como lo harías normalmente.

---

¡Y eso es todo! Con esta configuración, el panel de administración ahora usará el nuevo sistema robusto y te mostrará el estado de sincronización en tiempo real.

