# 🎨 Configuración de Endpoints Personalizados para Stable Diffusion

## 📋 Resumen

CharaForge ahora soporta **endpoints personalizados** para Stable Diffusion, permitiéndote usar tus propios modelos como **Stable Diffusion Illustrious** en lugar de depender únicamente de servicios externos.

## 🚀 Configuración Rápida

### 1. **Configurar tu Endpoint de Stable Diffusion**

Asegúrate de que tu servidor de Stable Diffusion esté ejecutándose y accesible. Los endpoints más comunes son:

- **Gradio WebUI**: `http://localhost:7860/api/predict`
- **ComfyUI**: `http://localhost:8188/api/predict`
- **AUTOMATIC1111**: `http://localhost:7860/api/predict`

### 2. **Modificar la Configuración**

Edita el archivo `src/lib/custom-endpoints.ts` y cambia la URL por defecto:

```typescript
export const STABLE_DIFFUSION_ILLUSTRIOUS: CustomEndpointConfig = {
  id: 'stable-diffusion-illustrious',
  name: 'Stable Diffusion Illustrious',
  url: 'http://tu-servidor:puerto/api/predict', // ← Cambia esto
  description: 'Custom Stable Diffusion Illustrious model endpoint',
  supportedModels: ['stable-diffusion-illustrious'],
  defaultSettings: {
    numInferenceSteps: 20,
    guidanceScale: 7.5,
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
  },
};
```

### 3. **Reiniciar la Aplicación**

```bash
npm run dev
```

## ⚙️ Configuración Avanzada

### **Parámetros Personalizables**

Puedes ajustar los parámetros por defecto para tu modelo:

```typescript
defaultSettings: {
  numInferenceSteps: 25,        // Más pasos = mejor calidad, más tiempo
  guidanceScale: 8.0,           // Más alto = más fiel al prompt
  negativePrompt: 'tu, prompt, negativo, aqui',
}
```

### **Múltiples Endpoints**

Agrega tantos endpoints como necesites:

```typescript
export const CUSTOM_ENDPOINTS: CustomEndpointConfig[] = [
  STABLE_DIFFUSION_ILLUSTRIOUS,
  {
    id: 'mi-otro-modelo',
    name: 'Mi Otro Modelo',
    url: 'http://otro-servidor:puerto/api/predict',
    description: 'Descripción de mi otro modelo',
    supportedModels: ['otro-modelo'],
    defaultSettings: {
      numInferenceSteps: 30,
      guidanceScale: 7.0,
      negativePrompt: 'blurry, low quality',
    },
  },
];
```

## 🔧 Formato de API Esperado

Tu endpoint debe aceptar y responder con este formato:

### **Request (POST)**
```json
{
  "prompt": "tu descripción del personaje",
  "negative_prompt": "blurry, low quality, distorted",
  "num_inference_steps": 20,
  "guidance_scale": 7.5,
  "width": 1024,
  "height": 1024,
  "sampler_name": "DPM++ 2M Karras",
  "cfg_scale": 7.5,
  "restore_faces": true,
  "tiling": false
}
```

### **Response (JSON)**
```json
{
  "images": ["base64_encoded_image_data"]
}
```

**O alternativamente:**
```json
{
  "data": ["base64_encoded_image_data"]
}
```

### **Response (Binary)**
Tu endpoint también puede devolver la imagen directamente como archivo binario.

## 🐛 Solución de Problemas

### **Error: "Custom endpoint not found"**
- Verifica que la URL sea correcta
- Asegúrate de que el servidor esté ejecutándose
- Prueba la URL en tu navegador

### **Error: "Authentication failed"**
- Si tu endpoint requiere API key, configúrala en el perfil del usuario
- Verifica el formato del header de autorización

### **Error: "No image data found"**
- Verifica que tu endpoint devuelva el formato esperado
- Revisa los logs del servidor de Stable Diffusion

### **Imágenes de baja calidad**
- Aumenta `numInferenceSteps` (20-50)
- Ajusta `guidanceScale` (7.0-12.0)
- Mejora el `negativePrompt`

## 📱 Uso en la Interfaz

1. Ve a **Character Generator**
2. Selecciona **"Stable Diffusion Illustrious (Custom)"** en el selector de modelos
3. Escribe tu descripción del personaje
4. Haz clic en **"Generate Portrait"**
5. La imagen se generará usando tu endpoint personalizado

## 🔒 Seguridad

- **Nunca** expongas tu endpoint personalizado a Internet sin autenticación
- Usa HTTPS en producción
- Considera implementar rate limiting
- Valida todos los inputs en tu servidor

## 📊 Monitoreo

Para monitorear el uso de tu endpoint personalizado:

1. Revisa los logs de la aplicación CharaForge
2. Monitorea los logs de tu servidor de Stable Diffusion
3. Usa herramientas como `htop` o `nvidia-smi` para monitorear recursos

## 🆘 Soporte

Si tienes problemas:

1. Verifica que tu endpoint esté funcionando con `curl`:
   ```bash
   curl -X POST http://localhost:7860/api/predict \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test","num_inference_steps":1}'
   ```

2. Revisa los logs de la aplicación en la consola del navegador

3. Verifica que tu servidor de Stable Diffusion esté configurado correctamente

## 🎯 Próximas Mejoras

- [ ] Interfaz para configurar endpoints desde la UI
- [ ] Validación automática de endpoints
- [ ] Métricas de rendimiento
- [ ] Soporte para múltiples modelos en un solo endpoint
- [ ] Cache de imágenes generadas