# 🚀 ¡Lanza tu Propio Servidor de IA en Kaggle! (Guía para CharaForge)

¡Hola, futuro maestro de la IA!

Esta guía te enseñará, paso a paso, cómo usar un servicio gratuito llamado **Kaggle** para crear tu propio servidor de generación de imágenes con un programa súper potente llamado **ComfyUI**. Luego, conectaremos ese servidor a nuestra aplicación CharaForge para que puedas crear imágenes con un control total.

Piensa en Kaggle como un **ordenador superpotente que puedes usar gratis en internet**, y en ComfyUI como un programa de dibujo mágico que instalaremos en ese ordenador.

---

## 🎯 ¿Cuál es el Objetivo?

Vamos a poner en marcha nuestro propio servidor de ComfyUI en Kaggle para poder usarlo como un motor de generación de imágenes personalizado dentro de CharaForge, ¡dándote un poder creativo ilimitado!

---

## Paso 1: Prepara tu Cuenta de Kaggle

1.  Ve a [kaggle.com](https://www.kaggle.com).
2.  Haz clic en **"Register"** en la esquina superior derecha. Puedes registrarte con tu cuenta de Google, lo cual es muy fácil.
3.  ¡Listo! Ya tienes acceso a los superordenadores de Kaggle.

---

## Paso 2: Crea un Nuevo "Notebook" (Tu Espacio de Trabajo)

Un "Notebook" es como un documento en blanco en la nube donde podemos escribir y ejecutar código.

1.  Una vez dentro de Kaggle, busca en el menú de la izquierda y haz clic en **"Create"**.
2.  Selecciona **"New Notebook"**.
3.  Se abrirá tu nuevo espacio de trabajo. ¡Aquí es donde ocurre la magia!

---

## Paso 3: Configura el Notebook para la Potencia de la IA

Necesitamos decirle a Kaggle que queremos usar uno de sus superordenadores con una tarjeta gráfica (GPU), que es lo que hace que la IA dibuje rápido.

1.  En la columna de la derecha de tu Notebook, busca la sección **"Settings"**.
2.  Busca una opción llamada **"Accelerator"** (Acelerador).
3.  En el menú desplegable, selecciona una de las opciones de **GPU** (como `GPU T4 x2`). Esto le da superpoderes a nuestro Notebook.
4.  **IMPORTANTE:** Asegúrate de que el interruptor de **"Internet"** esté encendido (en azul). Esto permite a nuestro Notebook descargar ComfyUI.



---

## Paso 4: ¡El Código Mágico! (Versión Corregida)

No te asustes por el código. Solo tienes que copiarlo y pegarlo. Este nuevo script es más robusto y soluciona el error que encontraste.

1.  En tu Notebook de Kaggle, verás una caja gris llamada "celda de código".
2.  **Borra cualquier código que venga por defecto** en esa celda.
3.  Ahora, **copia todo el código** que está en el cuadro de abajo:

```python
# @title (1) Instala ComfyUI y las dependencias necesarias
!git clone https://github.com/comfyanonymous/ComfyUI.git
%cd ComfyUI
!pip install -r requirements.txt

# @title (2) Descarga un Modelo de IA para Empezar
# Vamos a descargar un modelo base popular (Stable Diffusion XL) para que puedas empezar a crear.
!wget -O models/checkpoints/sd_xl_base_1.0.safetensors https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# @title (3) Lanza el Servidor de ComfyUI (¡Método Mejorado!)
import subprocess
import threading
import time
import re
import os

def run_comfyui():
    # Usamos subprocess para tener más control sobre el proceso
    process = subprocess.Popen(['python', 'main.py', '--listen'],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,
                               text=True)
    # Imprime la salida del servidor en tiempo real (útil para depurar)
    for line in iter(process.stdout.readline, ''):
        print(line, end='')
    process.wait()

# Ejecuta el servidor en un hilo separado para que no bloquee el notebook
thread = threading.Thread(target=run_comfyui)
thread.start()
print("⏳ Iniciando el servidor de ComfyUI en segundo plano...")

# @title (4) Muestra tu Dirección Pública (¡Método Mejorado!)
# Espera y busca la URL pública que genera Kaggle automáticamente
print("🔍 Buscando la URL pública...")
time.sleep(10) # Espera 10 segundos para que el servidor se inicie y Kaggle asigne la URL

# Busca la URL en los archivos de registro del notebook
log_path = '/kaggle/working/logs/'
url_found = False
for i in range(5): # Intenta buscar la URL varias veces
    try:
        # El nombre del archivo de log puede variar, así que buscamos el más reciente
        log_files = sorted([f for f in os.listdir(log_path) if f.endswith('.log')], reverse=True)
        if not log_files:
            raise FileNotFoundError("No log files found in /kaggle/working/logs/")
            
        with open(os.path.join(log_path, log_files[0]), 'r') as f:
            for line in f:
                match = re.search(r'कार्यवाही URL: (https://[a-z0-9-]+.kaggle.dev/)', line)
                if match:
                    print("\n" + "="*40)
                    print("✅ ¡Tu servidor de ComfyUI está listo!")
                    print(f"🔗 Tu URL Pública es: {match.group(1)}")
                    print("="*40 + "\n")
                    url_found = True
                    break
        if url_found:
            break
    except Exception as e:
        print(f"  ... Intento {i+1} fallido: {e}. Reintentando en 5 segundos.")
        time.sleep(5)

if not url_found:
    print("\n❌ No se pudo encontrar la URL pública automáticamente. Revisa los logs de arriba para encontrarla manualmente.")

```

4.  **Pega ese código** en la celda vacía de tu Notebook de Kaggle.
5.  Haz clic en el **botón de "play"** a la izquierda de la celda (o presiona `Shift + Enter`) para ejecutar el código.

---

## Paso 5: ¡Obtén tu URL Secreta!

La celda de código tardará unos minutos en ejecutarse. Verás un montón de texto de instalación. ¡No te preocupes, es normal!

Al final de todo, verás unas líneas resaltadas que dicen:

> ========================================
> ✅ ¡Tu servidor de ComfyUI está listo!
> 🔗 Tu URL Pública es: `https://xxxxxxxxxxxx.kaggle.dev/`
> ========================================

**¡Esa URL es tu llave de oro!** Es la dirección de tu servidor de IA personal. Cópiala y guárdala.

---

## Paso 6: Conecta tu Servidor a CharaForge

Ahora vamos a decirle a CharaForge cómo hablar con nuestro nuevo servidor.

1.  Vuelve a la aplicación **CharaForge**.
2.  Ve al **Panel de Administración** -> **AI Models**.
3.  Crea un nuevo modelo o edita uno existente.
4.  En el formulario, establece estas opciones:
    *   **Orchestration Engine:** `ComfyUI`
    *   **ComfyUI Server URL:** Pega aquí tu URL de Kaggle, pero **añádele `/prompt` al final**. Debería verse así: `https://xxxxxxxxxxxx.kaggle.dev/prompt`
    *   **ComfyUI Workflow (JSON):** Ve a la interfaz de tu ComfyUI (abriendo tu URL pública en una nueva pestaña), crea un flujo de trabajo simple (como el que viene por defecto) y haz clic en "Save (API Format)". Copia el JSON que se descarga y pégalo aquí.

¡Y ya está! Ahora, cuando uses ese modelo en el generador de personajes, CharaForge enviará la orden a **tu propio servidor de IA en Kaggle** para que cree la imagen.

¡Felicidades, has desplegado y conectado con éxito tu propio motor de IA de nivel profesional!
