
# 🚀 Tutorial: Tu Pipeline Profesional de Procesamiento de Imágenes con Kaggle

¡Hola de nuevo, maestro de la Forja!

Hemos visto que el sistema de Cloud Functions puede ser frágil. Siguiendo tu excelente intuición, vamos a reemplazarlo con un sistema de "worker" de Python mucho más robusto, transparente y profesional, que se ejecutará en un notebook de Kaggle.

**El Objetivo:** Crear un pipeline donde tu aplicación principal simplemente "pide" un trabajo, y un trabajador externo y dedicado se encarga de todo el procesamiento pesado de forma fiable.

---

## El Flujo de Trabajo

1.  **La Petición (En CharaForge):**
    *   Cuando haces clic en "Process" en la galería de tu personaje, la aplicación ahora hace algo muy simple: sube la imagen a una carpeta especial en la nube (`raw-uploads/...`) y actualiza el estado del personaje a `removing-background`. ¡Eso es todo! El trabajo está en cola.

2.  **El Trabajo Pesado (El Worker de Kaggle):**
    *   Un notebook de Kaggle, que puedes programar para que se ejecute periódicamente (o ejecutarlo tú mismo), estará vigilando la base de datos.
    *   Cuando vea un personaje que necesita ser procesado, se pondrá a trabajar.

3.  **El Resultado:**
    *   El worker de Kaggle realizará las llamadas a la API de ClipDrop, subirá la imagen final y actualizará el estado del personaje a `complete`. Tu aplicación CharaForge simplemente verá el cambio en la base de datos y reflejará el resultado.

---

## Paso 1: Configura tu Notebook Worker en Kaggle

1.  **Crea un Nuevo Notebook en Kaggle:** Ve a Kaggle, haz clic en "Create" > "New Notebook".
2.  **Activa Internet:** En la configuración del notebook (columna derecha), asegúrate de que el interruptor de "Internet" esté encendido (azul).
3.  **Añade tus "Secrets":** Esta es la parte más importante para la seguridad.
    *   Ve a la pestaña "Add-ons" > "Secrets".
    *   Añade dos secretos:
        *   `FIREBASE_SERVICE_ACCOUNT_KEY`: Pega aquí el contenido **completo** de tu archivo JSON de clave de servicio de Firebase.
        *   `CLIPDROP_API_KEY`: Pega aquí tu clave de API de ClipDrop.

---

## Paso 2: El Código del Worker

Ahora, pega el siguiente script de Python en una celda de tu notebook de Kaggle.

```python
# @title (1) Instalar las librerías necesarias
# Usamos -q para una instalación más limpia
!pip install -q google-cloud-storage firebase-admin requests tqdm

# @title (2) Configurar la Conexión a Firebase
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud import storage as gcs
from kaggle_secrets import UserSecretsClient
import requests
from tqdm.notebook import tqdm
import time

# --- Configuración ---
# ¡IMPORTANTE! Asegúrate de que este sea el nombre de tu bucket de Firebase Storage.
# Lo puedes encontrar en tu .env file (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
STORAGE_BUCKET = "charaforge-app.appspot.com" # REEMPLAZA ESTO
# -------------------

print("🔧 Cargando secretos y configurando conexiones...")

try:
    # Cargar secretos de Kaggle de forma segura
    user_secrets = UserSecretsClient()
    service_account_json_str = user_secrets.get_secret("FIREBASE_SERVICE_ACCOUNT_KEY")
    CLIPDROP_API_KEY = user_secrets.get_secret("CLIPDROP_API_KEY")

    # Inicializar Firebase Admin SDK si no se ha hecho ya
    if not firebase_admin._apps:
        service_account_info = json.loads(service_account_json_str)
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred, {
            'storageBucket': STORAGE_BUCKET
        })

    db = firestore.client()
    bucket = storage.bucket()
    print("✅ Conexión con Firebase establecida con éxito.")
except Exception as e:
    print(f"❌ ERROR FATAL: No se pudo inicializar Firebase. Comprueba tus secretos y el nombre del bucket.")
    print(f"Detalles: {e}")


# @title (3) Funciones de Procesamiento de Imágenes

def update_status(doc_ref, status):
    """Actualiza el estado del procesamiento en Firestore."""
    print(f"  -> Actualizando estado a: {status}")
    doc_ref.update({'visuals.showcaseProcessingStatus': status})

def remove_background(image_bytes):
    """Llama a la API de ClipDrop para quitar el fondo."""
    if not CLIPDROP_API_KEY:
        raise ValueError("CLIPDROP_API_KEY no está configurada.")
    
    print("  -> Iniciando eliminación de fondo con ClipDrop...")
    response = requests.post('https://api.clipdrop.co/remove-background/v1',
      files = { 'image_file': ('image.png', image_bytes, 'image/png') },
      headers = { 'x-api-key': CLIPDROP_API_KEY }
    )
    if response.ok:
        print("  ✅ Fondo eliminado con éxito.")
        return response.content
    else:
        raise Exception(f"Error en la API de ClipDrop (Remove BG): {response.status_code} {response.text}")

def upscale_image(image_bytes):
    """Llama a la API de ClipDrop para mejorar la resolución."""
    if not CLIPDROP_API_KEY:
        raise ValueError("CLIPDROP_API_KEY no está configurada.")
        
    print("  -> Iniciando mejora de resolución con ClipDrop...")
    response = requests.post('https://api.clipdrop.co/super-resolution/v1',
      files = { 'image_file': ('image.png', image_bytes, 'image/png') },
      headers = { 'x-api-key': CLIPDROP_API_KEY }
    )
    if response.ok:
        print("  ✅ Resolución mejorada con éxito.")
        return response.content
    else:
        raise Exception(f"Error en la API de ClipDrop (Upscale): {response.status_code} {response.text}")

# @title (4) Bucle Principal del Worker

def run_image_processing_worker():
    """Busca y procesa trabajos de la cola de imágenes."""
    print("\n--- 🕵️ Iniciando búsqueda de trabajos de procesamiento ---")
    
    # Busca personajes cuyo estado indique que necesitan procesamiento
    processing_statuses = ['removing-background', 'upscaling', 'finalizing']
    query = db.collection(u'characters').where(u'visuals.showcaseProcessingStatus', u'in', processing_statuses)
    
    docs = query.stream()
    
    found_jobs = 0
    for doc in docs:
        found_jobs += 1
        char_data = doc.to_dict()
        char_id = doc.id
        print(f"\n🔥 Encontrado trabajo para el personaje: {char_data.get('core', {}).get('name', char_id)}")
        
        try:
            # Descargar la imagen original
            original_image_url = char_data.get('visuals', {}).get('imageUrl')
            if not original_image_url:
                raise ValueError("El personaje no tiene una imagen principal (imageUrl).")
            
            print(f"  -> Descargando imagen original...")
            response = requests.get(original_image_url, stream=True)
            response.raise_for_status()
            image_bytes = response.content
            print(f"  ✅ Descarga completa ({len(image_bytes) / 1024:.2f} KB).")

            # --- Pipeline de Procesamiento ---
            update_status(doc.reference, 'removing-background')
            no_bg_bytes = remove_background(image_bytes)
            
            update_status(doc.reference, 'upscaling')
            upscaled_bytes = upscale_image(no_bg_bytes)
            
            update_status(doc.reference, 'finalizing')
            # En un futuro, aquí podrías usar 'sharp' (o Pillow en Python) si necesitas más conversiones.
            # Por ahora, la imagen de ClipDrop ya es de alta calidad.
            final_bytes = upscaled_bytes
            
            # Subir la imagen final
            final_filename = f"showcase_{char_id}.png"
            destination_blob_name = f"showcase-images/{char_data['meta']['userId']}/{char_id}/{final_filename}"
            
            blob = bucket.blob(destination_blob_name)
            print(f"  -> Subiendo imagen final a: {destination_blob_name}")
            blob.upload_from_string(final_bytes, content_type='image/png')
            blob.make_public()
            final_url = blob.public_url
            print(f"  ✅ Subida completa. URL pública: {final_url}")
            
            # Actualizar Firestore con el resultado final
            doc.reference.update({
                'visuals.showcaseImageUrl': final_url,
                'visuals.isShowcaseProcessed': True,
                'visuals.showcaseProcessingStatus': 'complete'
            })
            print(f"🎉 ¡Procesamiento completado para {char_data.get('core', {}).get('name', char_id)}!")

        except Exception as e:
            print(f"🚨 ERROR al procesar {char_id}: {e}")
            # Si algo falla, marcamos el trabajo como fallido para que no se reintente infinitamente.
            doc.reference.update({'visuals.showcaseProcessingStatus': 'failed'})

    if found_jobs == 0:
        print("✅ No se encontraron trabajos en la cola. ¡Todo al día!")

# @title (5) ¡Ejecutar el Worker!
run_image_processing_worker()
```

---

## Paso 3: ¡Ejecuta y Observa la Magia!

1.  Haz clic en el botón de "play" junto a la celda para ejecutar el script.
2.  El worker se conectará a tu Firebase, buscará personajes que necesiten procesamiento y comenzará a trabajar. Verás el progreso detallado impreso en la salida del notebook.
3.  Puedes programar este notebook para que se ejecute automáticamente en Kaggle (por ejemplo, cada 15 minutos) para tener un sistema completamente autónomo.

¡Y ya está! Has implementado un pipeline de procesamiento de imágenes robusto y profesional, desacoplado de tu aplicación principal. ¡Felicidades, Forjador!

    