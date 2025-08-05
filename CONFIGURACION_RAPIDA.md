# 🚀 Configuración Rápida - Resolver Error 500

## ❌ **ERROR ACTUAL**
```
500 (Internal Server Error) en save-character.ts
```

## 🎯 **CAUSA**
Las variables de entorno de Firebase no están configuradas.

## ✅ **SOLUCIÓN RÁPIDA (5 minutos)**

### **Paso 1: Configurar Firebase**

1. **Ir a Firebase Console**: https://console.firebase.google.com/
2. **Crear/seleccionar proyecto**
3. **Habilitar Authentication**: Email/Password
4. **Crear Firestore Database**: Modo test
5. **Crear Storage bucket**

### **Paso 2: Obtener Credenciales Web**

1. **Ir a Project Settings** (ícono engranaje)
2. **Scroll hasta "Your apps"**
3. **Click ícono `</>`** (Web)
4. **Registrar app**: "CharaForge Web"
5. **Copiar firebaseConfig**:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### **Paso 3: Obtener Service Account Key**

1. **Ir a Project Settings > Service accounts**
2. **Click "Generate new private key"**
3. **Se descarga un archivo JSON**
4. **Abrir el archivo y COPIAR TODO el contenido**

### **Paso 4: Configurar .env**

Editar el archivo `.env` en la raíz del proyecto:

```env
# FIREBASE CLIENT (del firebaseConfig)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# FIREBASE SERVER (JSON en UNA SOLA LÍNEA)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}

# GOOGLE AI (opcional por ahora)
GOOGLE_AI_API_KEY=tu-clave-de-google-ai
```

**⚠️ IMPORTANTE**: `FIREBASE_SERVICE_ACCOUNT_KEY` debe estar en UNA SOLA LÍNEA.

### **Paso 5: Verificar**

```bash
npm run firebase:setup
```

Debería mostrar: ✅ All Firebase environment variables are correctly configured!

### **Paso 6: Reiniciar Servidor**

```bash
npm run dev
```

## 🎉 **RESULTADO**

- ✅ Error 500 resuelto
- ✅ Server Actions funcionando
- ✅ Autenticación operativa
- ✅ Guardado de personajes funcional

## 🆘 **Si Aún Hay Problemas**

1. **Verificar que el JSON esté en una línea**
2. **Revisar que no falten comillas**
3. **Reiniciar el servidor de desarrollo**
4. **Consultar logs en terminal**

## 🔧 **Herramientas de Debugging**

```bash
# Verificar configuración
npm run firebase:setup

# Ver logs del servidor
npm run dev

# Testing endpoint
curl http://localhost:9002/api/auth/test-cookie
```

---

**Tiempo estimado**: 5-10 minutos
**Resultado**: Aplicación completamente funcional ✅