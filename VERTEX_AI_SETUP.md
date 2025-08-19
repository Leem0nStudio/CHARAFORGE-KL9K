# ☁️ Configuración de Vertex AI Model Garden para Stable Diffusion

## 📋 Resumen

CharaForge ahora soporta **Google Cloud Vertex AI Model Garden** para Stable Diffusion, permitiéndote usar modelos de alta calidad como **Stable Diffusion Illustrious** hospedados en Google Cloud con escalabilidad y confiabilidad empresarial.

## 🚀 Configuración Rápida

### 1. **Configurar Google Cloud Project**

Asegúrate de que tienes un proyecto de Google Cloud configurado con:
- **Vertex AI API** habilitada
- **Service Account** con permisos adecuados
- **Endpoints** de Stable Diffusion desplegados

### 2. **Configurar Variables de Entorno**

En tu archivo `.env`, asegúrate de tener:

```bash
# Firebase Service Account (incluye Project ID)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto",...}

# Opcional: Vertex AI específico
VERTEX_AI_LOCATION=us-central1
```

### 3. **Configurar Modelos de Vertex AI**

Edita el archivo `src/lib/vertex-ai-config.ts` y actualiza los endpoint IDs:

```typescript
export const STABLE_DIFFUSION_ILLUSTRIOUS: VertexAIModelConfig = {
  id: 'stable-diffusion-illustrious',
  name: 'Stable Diffusion Illustrious',
  endpointId: 'TU_ENDPOINT_ID_REAL', // ← Cambia esto
  description: 'High-quality Stable Diffusion Illustrious model',
  supportedFeatures: ['text-to-image', 'lora-support', 'high-resolution'],
  defaultSettings: {
    guidanceScale: 7.5,
    numInferenceSteps: 20,
    sampleCount: 1,
  },
  location: 'us-central1', // ← Cambia si es necesario
};
```

### 4. **Reiniciar la Aplicación**

```bash
npm run dev
```

## ⚙️ Configuración Avanzada

### **Permisos de Service Account**

Tu service account necesita estos roles:
- `Vertex AI User` (`roles/aiplatform.user`)
- `Service Account Token Creator` (`roles/iam.serviceAccountTokenCreator`)

### **Configuración de Endpoints**

Para cada modelo de Vertex AI, configura:

```typescript
{
  id: 'mi-modelo',
  name: 'Mi Modelo',
  endpointId: '1234567890123456789',
  description: 'Descripción del modelo',
  supportedFeatures: ['text-to-image', 'lora-support'],
  defaultSettings: {
    guidanceScale: 8.0,           // Más alto = más fiel al prompt
    numInferenceSteps: 25,        // Más pasos = mejor calidad
    sampleCount: 1,               // Número de imágenes a generar
  },
  location: 'us-central1',        // Región de Google Cloud
}
```

### **Múltiples Regiones**

Vertex AI soporta múltiples regiones:

```typescript
export function getSupportedVertexAILocations(): string[] {
  return [
    'us-central1',      // Iowa (recomendado)
    'us-east1',         // South Carolina
    'us-west1',         // Oregon
    'europe-west1',     // Belgium
    'asia-northeast1',  // Tokyo
  ];
}
```

## 🔧 Formato de API de Vertex AI

### **Request (POST)**
```json
{
  "instances": [
    {
      "text": "tu descripción del personaje",
      "lora": "nombre-del-lora" // Opcional
    }
  ],
  "parameters": {
    "width": 1024,
    "height": 1024,
    "sampleCount": 1,
    "guidanceScale": 7.5,
    "numInferenceSteps": 20
  }
}
```

### **Response**
```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "base64_encoded_image_data"
    }
  ]
}
```

## 🎨 Uso en la Interfaz

1. Ve a **Character Generator**
2. Selecciona **"Stable Diffusion Illustrious (Vertex AI)"** en el selector de modelos
3. Escribe tu descripción del personaje
4. Haz clic en **"Generate Portrait"**
5. La imagen se generará usando Vertex AI Model Garden

## 🔒 Seguridad y Autenticación

### **Service Account**
- **Nunca** expongas tu service account key
- Usa **IAM roles** mínimos necesarios
- Considera **rotación regular** de keys

### **Endpoints**
- **Solo** endpoints autorizados
- **Rate limiting** configurado
- **Logging** habilitado para auditoría

## 📊 Monitoreo y Costos

### **Vertex AI Console**
- Monitorea uso de endpoints
- Revisa logs de predicciones
- Controla costos por región

### **Cloud Monitoring**
```bash
# Métricas importantes
- prediction_request_count
- prediction_latency
- prediction_error_count
```

### **Costos Estimados**
- **Endpoint activo**: ~$0.50-2.00/hora
- **Predicción**: ~$0.01-0.05 por imagen
- **Almacenamiento**: ~$0.02/GB/mes

## 🐛 Solución de Problemas

### **Error: "Authentication failed"**
- Verifica `FIREBASE_SERVICE_ACCOUNT_KEY`
- Confirma permisos del service account
- Verifica que Vertex AI API esté habilitada

### **Error: "Endpoint not found"**
- Verifica el endpoint ID
- Confirma la región (`us-central1`, etc.)
- Verifica que el endpoint esté activo

### **Error: "Model unavailable"**
- Endpoint puede estar escalando
- Verifica cuotas de la región
- Revisa logs en Vertex AI Console

### **Imágenes de baja calidad**
- Aumenta `numInferenceSteps` (20-50)
- Ajusta `guidanceScale` (7.0-12.0)
- Verifica que el modelo esté cargado

## 🚀 Despliegue de Endpoints

### **Usando Vertex AI Console**
1. Ve a **Vertex AI > Model Garden**
2. Busca **Stable Diffusion**
3. Haz clic en **Deploy to Endpoint**
4. Configura recursos y región
5. Copia el **Endpoint ID**

### **Usando gcloud CLI**
```bash
# Desplegar modelo
gcloud ai endpoints create \
  --region=us-central1 \
  --display-name="Stable Diffusion Illustrious"

# Obtener endpoint ID
gcloud ai endpoints list --region=us-central1
```

## 📱 Integración con LoRAs

### **Configurar LoRA en Vertex AI**
```typescript
{
  id: 'mi-lora',
  name: 'Mi LoRA',
  engine: 'vertexai',
  type: 'lora',
  vertexAiAlias: 'nombre-en-vertex-ai', // ← Importante
  triggerWords: ['keyword1', 'keyword2'],
}
```

### **Uso en Generación**
- El sistema automáticamente incluye el LoRA
- Los trigger words se agregan al prompt
- El alias se envía al endpoint de Vertex AI

## 🎯 Próximas Mejoras

- [ ] Interfaz para configurar endpoints desde la UI
- [ ] Validación automática de endpoints
- [ ] Métricas de rendimiento en tiempo real
- [ ] Soporte para múltiples proyectos
- [ ] Cache de imágenes generadas
- [ ] Balanceo de carga entre regiones

## 🆘 Soporte

### **Google Cloud Support**
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai)
- [Model Garden](https://cloud.google.com/vertex-ai/model-garden)
- [Community Support](https://cloud.google.com/support)

### **CharaForge Support**
1. Verifica logs en la consola del navegador
2. Revisa logs del servidor
3. Confirma configuración en `vertex-ai-config.ts`
4. Prueba endpoint con `curl` o Postman

### **Debugging**
```bash
# Probar endpoint directamente
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"instances":[{"text":"test"}],"parameters":{"width":512,"height":512}}' \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/TU_PROJECT/locations/us-central1/endpoints/TU_ENDPOINT:predict"
```