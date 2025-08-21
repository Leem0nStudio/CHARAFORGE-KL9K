# 🚀 Tutorial: Arquitectura Profesional de Sincronización de Modelos con Kaggle y GCS

¡Felicidades! Has descubierto una de las piezas clave para una arquitectura de IA robusta. La capacidad de Kaggle para importar modelos directamente desde un bucket de Google Cloud Storage (GCS) nos permite construir un flujo de trabajo profesional, estable y automatizado.

Esta guía explica cómo las piezas de CharaForge que hemos construido (el botón "Sync", el `MODELS_STORAGE_BUCKET`) se unen con Kaggle para crear este sistema.

---

## 🎯 El Objetivo: Un Almacén de Modelos Central y Fiable

**El problema:** Descargar modelos de 5GB directamente desde fuentes públicas (como Civitai) en un servidor web de corta duración es poco fiable y propenso a errores. Además, los enlaces pueden romperse.

**La solución profesional:** Usamos un "worker" externo (un notebook de Kaggle) para que haga el trabajo pesado. Este worker descarga los modelos UNA SOLA VEZ y los guarda en nuestro propio **almacén de modelos central y privado** (`MODELS_STORAGE_BUCKET`). Desde allí, podemos usarlos de forma segura y rápida en otros notebooks.

**CharaForge actúa como el "cerebro" o el "orquestador" de todo este proceso.**

---

### El Flujo de Trabajo en 3 Pasos

Este es el ciclo completo, desde que haces clic en CharaForge hasta que el modelo está listo para usarse.

#### Paso 1: La Orden (Se da en CharaForge)

1.  **Inicias el Trabajo:** En el panel de administración de CharaForge (`/admin/models`), encuentras un modelo que has añadido desde Civitai y que tiene el estado "Not Synced".
2.  **Haces clic en "Sync Now"**.
3.  **¿Qué hace CharaForge?:** ¡Casi nada! Y eso es lo bueno. No intenta descargar el modelo. Simplemente va a la base de datos (Firestore) y cambia el estado de ese modelo de `notsynced` a `syncing`.

¡Eso es todo por parte de CharaForge! Ha dado la orden. Ahora, la orden está en el "tablón de anuncios" (nuestra base de datos) esperando a que un trabajador la vea.

#### Paso 2: El Trabajo Pesado (Lo hace un Worker de Kaggle)

Aquí es donde entra en juego un notebook de Kaggle que actúa como nuestro "trabajador incansable". Este notebook no es para generar imágenes, sino para gestionar nuestros activos.

**Configuración del Notebook "Worker":**

1.  **Crea un nuevo Notebook en Kaggle:** Igual que en el tutorial de ComfyUI.
2.  **Añade tus Secretos de Firebase:** En la sección "Add-ons" -> "Secrets" de tu notebook, necesitas añadir dos secretos:
    *   `FIREBASE_SERVICE_ACCOUNT_KEY`: Pega aquí el contenido completo de tu clave de servicio JSON.
    *   `CIVITAI_API_KEY`: Pega aquí tu clave de API de Civitai.
3.  **Pega el Código del Worker:** Copia y pega el siguiente código de Python en una celda de tu notebook.

```python
# @title (1) Instalar Librerías Necesarias
!pip install google-cloud-storage firebase-admin requests tqdm

# @title (2) Configurar la Conexión a Firebase
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud import storage as gcs
from kaggle_secrets import UserSecretsClient

# Cargar secretos de Kaggle
user_secrets = UserSecretsClient()
service_account_json_str = user_secrets.get_secret("FIREBASE_SERVICE_ACCOUNT_KEY")
civitai_api_key = user_secrets.get_secret("CIVITAI_API_KEY")

# --- Configuración ---
# ¡IMPORTANTE! Cambia esto por el nombre de tu bucket de modelos.
MODELS_STORAGE_BUCKET = "charaforge-models-bucket" # Reemplaza con el nombre de tu bucket
# -------------------

# Inicializar Firebase Admin SDK
service_account_info = json.loads(service_account_json_str)
cred = credentials.Certificate(service_account_info)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'storageBucket': MODELS_STORAGE_BUCKET
    })

db = firestore.client()
bucket = storage.bucket()
print("✅ Conexión con Firebase establecida.")

# @title (3) Función Principal del Worker
import requests
from tqdm import tqdm

def get_download_url(model_id, version_id, api_key):
    """Obtiene la URL de descarga directa desde la API de Civitai."""
    url = f"https://civitai.com/api/v1/model-versions/{version_id}"
    response = requests.get(url, headers={"Authorization": f"Bearer {api_key}"})
    if response.status_code == 200:
        return response.json().get("files", [{}])[0].get("downloadUrl")
    return None

def sync_model(doc_ref, model_data):
    """Descarga un modelo y lo sube a nuestro bucket de GCS."""
    model_id = model_data.get("civitaiModelId")
    version_id = model_data.get("versionId")
    model_name = model_data.get("name", "unknown_model")
    
    print(f"🔄 Empezando sincronización para: {model_name}")
    doc_ref.update({"syncStatus": "syncing"})

    download_url = get_download_url(model_id, version_id, civitai_api_key)
    if not download_url:
        print(f"❌ Error: No se pudo obtener la URL de descarga para el modelo {model_name}.")
        doc_ref.update({"syncStatus": "notsynced"})
        return

    print(f"⬇️ Descargando desde: {download_url}")
    
    # Descargar el archivo con barra de progreso
    response = requests.get(download_url + f"?token={civitai_api_key}", stream=True)
    total_size = int(response.headers.get('content-length', 0))
    block_size = 1024 
    
    # Usa un nombre de archivo temporal
    temp_filename = f"{version_id}.tmp"
    
    with open(temp_filename, 'wb') as f, tqdm(
        total=total_size, unit='iB', unit_scale=True, desc=model_name
    ) as pbar:
        for data in response.iter_content(block_size):
            f.write(data)
            pbar.update(len(data))

    # Subir a GCS
    file_extension = ".safetensors" # Asumimos safetensors, puedes hacerlo más inteligente
    blob_name = f"models/{model_name.replace(' ', '_')}/{version_id}{file_extension}"
    blob = bucket.blob(blob_name)
    
    print(f"⬆️ Subiendo a GCS en: {blob_name}")
    blob.upload_from_filename(temp_filename)
    
    # Limpiar archivo temporal
    os.remove(temp_filename)

    # Actualizar Firestore
    gs_uri = f"gs://{MODELS_STORAGE_BUCKET}/{blob_name}"
    doc_ref.update({"syncStatus": "synced", "gcsUri": gs_uri})
    print(f"✅ ¡Sincronización completada para {model_name}! URI: {gs_uri}")


# @title (4) Bucle Principal del Worker: Buscar y Procesar Trabajos
def run_worker():
    """Busca trabajos en cola y los procesa."""
    print("\n--- Buscando nuevos trabajos de sincronización ---")
    models_ref = db.collection(u'ai_models')
    query = models_ref.where(u'syncStatus', u'==', u'syncing')
    
    docs = query.stream()
    
    found_jobs = False
    for doc in docs:
        found_jobs = True
        model_data = doc.to_dict()
        try:
            sync_model(doc.reference, model_data)
        except Exception as e:
            print(f"🚨 Error procesando {model_data.get('name')}: {e}")
            doc.reference.update({"syncStatus": "notsynced"}) # Reset on failure

    if not found_jobs:
        print("No hay trabajos en la cola. Esperando al siguiente ciclo.")

# Ejecutar el worker
run_worker()

```
4.  **Automatiza la Ejecución:** En la configuración de tu notebook de Kaggle, puedes establecer que se ejecute de forma programada (por ejemplo, cada hora) para que busque y procese nuevos trabajos automáticamente.

#### Paso 3: Usar el Modelo Sincronizado (¡Tu Descubrimiento!)

1.  **Obtén la Ruta:** Una vez que el worker ha terminado, verás en el panel de administración de CharaForge que el estado del modelo es "Synced". Si editas el modelo, verás un nuevo campo con la ruta `gs://...`.
2.  **Importa en Kaggle:** Ahora, al crear un nuevo notebook (como el de ComfyUI), en lugar de descargar el modelo desde una URL pública, vas a "Upload Model" -> "Import Google Cloud Storage" y pegas esa ruta `gs://...`.

¡Y listo! Has creado un puente robusto entre tu aplicación CharaForge y tu entorno de ejecución de IA en Kaggle.