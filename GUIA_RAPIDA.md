# 🚀 CharaForge - Guía Rápida de Instalación

## ⚡ Para Usuarios Experimentados

Esta es una versión condensada para desarrolladores con experiencia. Para principiantes, consulta `DOCUMENTACION_COMPLETA.md`.

### 📋 Requisitos Previos
- Node.js 18+ y npm
- Cuenta de Google
- Git (opcional)

### 🛠️ Instalación Express

```bash
# 1. Clonar e instalar dependencias
git clone [URL_REPOSITORIO]
cd charaforge
npm install

# 2. Verificar configuración
npm run firebase:setup
```

### ⚙️ Configuración Rápida

#### 1. Firebase Setup
1. Crear proyecto: https://console.firebase.google.com/
2. Habilitar Authentication (email/password)
3. Crear Firestore Database (modo test)
4. Crear Storage bucket
5. Obtener config web y service account key

#### 2. Google AI Studio
1. Ir a: https://aistudio.google.com/
2. Crear API key

#### 3. Variables de Entorno
Crear `.env` en raíz:

```env
# Firebase Cliente
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Servidor (JSON en una línea)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Google AI
GOOGLE_AI_API_KEY=tu-google-ai-key

# Opcional
NEXT_PUBLIC_USE_EMULATORS=false
```

### ▶️ Ejecutar

```bash
# Desarrollo
npm run dev

# Verificar en http://localhost:9002
```

### 👑 Primer Admin

```bash
# Después del primer registro
npm run admin:grant -- [UID_USUARIO]
```

### 🔧 Comandos Útiles

```bash
npm run firebase:setup         # Validar config
npm run firebase:emulators     # Emuladores locales
npm run admin:list             # Listar admins
npm run build                  # Build producción
```

### 🚀 Stack Tecnológico

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **IA**: Google Genkit, Gemini 1.5/2.0 Flash
- **UI**: shadcn/ui, Lucide React

### 💡 Límites Gratuitos

- **Firebase**: 50k lecturas/día, 20k escrituras/día, 1GB storage
- **Google AI**: 15 req/min (Gemini 1.5), 10 req/min (Gemini 2.0)

### 🔗 Enlaces Rápidos

- [Firebase Console](https://console.firebase.google.com/)
- [Google AI Studio](https://aistudio.google.com/)
- [Documentación Completa](./DOCUMENTACION_COMPLETA.md)

---

**¿Problemas?** Consulta la documentación completa o la sección de troubleshooting.