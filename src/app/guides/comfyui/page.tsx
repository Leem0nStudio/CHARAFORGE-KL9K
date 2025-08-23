
import { BackButton } from '@/components/back-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';

const pythonScript = `
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
time.sleep(15) # Espera 15 segundos para que el servidor se inicie y Kaggle asigne la URL

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
                    print("\\n" + "="*40)
                    print("✅ ¡Tu servidor de ComfyUI está listo!")
                    print(f"🔗 Tu URL Pública es: {match.group(1)}")
                    print("="*40 + "\\n")
                    url_found = True
                    break
        if url_found:
            break
    except Exception as e:
        print(f"  ... Intento {i+1} fallido: {e}. Reintentando en 5 segundos.")
        time.sleep(5)

if not url_found:
    print("\\n❌ No se pudo encontrar la URL pública automáticamente. Revisa los logs de arriba para encontrarla manualmente.")
`;

export default function ComfyUiGuidePage() {
    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                 <BackButton 
                    title="ComfyUI on Kaggle Guide"
                    description="Launch your own free, powerful AI image generation server."
                 />
                
                <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Set up your Kaggle Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Go to <a href="https://kaggle.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">kaggle.com</a> and register for a new account. Using a Google account is the easiest way.</li>
                            <li>Once registered, you now have access to Kaggle's powerful cloud computers.</li>
                        </ol>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Create and Configure a Notebook</CardTitle>
                         <CardDescription>A "Notebook" is your workspace in the cloud where you can run code.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>From the Kaggle homepage, click <Badge variant="secondary">Create</Badge> in the left-hand menu, then select <Badge variant="secondary">New Notebook</Badge>.</li>
                            <li>In the right-hand column of your new Notebook, find the <Badge>Settings</Badge> section.</li>
                             <li>Find the <Badge>Accelerator</Badge> option and select a <Badge variant="destructive">GPU</Badge> from the dropdown (e.g., GPU T4 x2). This gives your Notebook the power to generate images quickly.</li>
                             <li>**CRITICAL:** Ensure the <Badge>Internet</Badge> toggle is turned on (blue). This allows your Notebook to download ComfyUI.</li>
                        </ol>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Run the Magic Script</CardTitle>
                        <CardDescription>This script does all the heavy lifting for you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ol className="list-decimal list-inside space-y-4">
                            <li>In your Kaggle Notebook, you'll see a grey box called a "code cell". Delete any default code inside it.</li>
                            <li>Copy the entire Python script below and paste it into the empty code cell.</li>
                             <CodeBlock code={pythonScript} />
                            <li>Click the "Play" button to the left of the cell (or press <Badge>Shift + Enter</Badge>) to run the script. It will take a few minutes to install everything.</li>
                        </ol>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Step 4: Get Your Secret URL</CardTitle>
                        <CardDescription>The script will find and display the public URL of your new server.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>After a few minutes, you will see a highlighted message at the end of the output that looks like this:</p>
                        <div className="my-4 p-4 bg-muted rounded-lg text-center">
                            <p className="text-2xl">✅</p>
                            <p className="font-semibold">¡Tu servidor de ComfyUI está listo!</p>
                            <p className="font-mono bg-background p-2 rounded-md mt-2">🔗 Tu URL Pública es: https://xxxxxxxx.kaggle.dev/</p>
                        </div>
                        <p>That URL is the key! It's the public address of your personal AI server.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Step 5: Connect to CharaForge</CardTitle>
                        <CardDescription>Finally, tell CharaForge how to talk to your new server.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-4">
                            <li>Go back to the <Badge>Admin Panel</Badge> -&gt; <Badge>AI Models</Badge> page in CharaForge.</li>
                            <li>Create a new model or edit an existing one.</li>
                            <li>In the form, set these options:</li>
                               <ul className="list-disc list-inside pl-6 space-y-2 mt-2">
                                  <li>**Orchestration Engine:** <Badge>ComfyUI</Badge></li>
                                  <li>**ComfyUI Server URL:** Paste your public Kaggle URL here, but **add /prompt at the end**. It should look like: <Badge variant="outline">https://xxxxxxxx.kaggle.dev/prompt</Badge></li>
                                  <li>**ComfyUI Workflow (JSON):** Open your public Kaggle URL in a new browser tab. You'll see the ComfyUI interface. Click the <Badge>Save (API Format)</Badge> button. This will download a JSON file. Open that file, copy its entire contents, and paste it into this field.</li>
                               </ul>
                        </ol>
                         <p className="mt-4 font-semibold">You're all set! When you use this model in the character generator, CharaForge will now send requests to your own AI server on Kaggle to create the image.</p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

    