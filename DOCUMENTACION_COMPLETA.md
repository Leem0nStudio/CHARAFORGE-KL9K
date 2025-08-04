# CharaForge - Documentación Completa para Principiantes

## 📋 Tabla de Contenidos
1. [¿Qué es CharaForge?](#qué-es-charaforge)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Herramientas Necesarias (100% Gratuitas)](#herramientas-necesarias-100-gratuitas)
4. [Instalación Paso a Paso](#instalación-paso-a-paso)
5. [Configuración de Firebase](#configuración-de-firebase)
6. [Configuración de Google AI](#configuración-de-google-ai)
7. [Variables de Entorno](#variables-de-entorno)
8. [Ejecutar la Aplicación](#ejecutar-la-aplicación)
9. [Características de la Aplicación](#características-de-la-aplicación)
10. [Administración de Usuarios](#administración-de-usuarios)
11. [Solución de Problemas](#solución-de-problemas)
12. [Despliegue (Opcional)](#despliegue-opcional)

---

## 🎯 ¿Qué es CharaForge?

**CharaForge** es una aplicación web moderna que permite crear personajes ficticios con la ayuda de Inteligencia Artificial. Las principales funcionalidades incluyen:

- **Generación de biografías**: Describe brevemente un personaje y la IA creará una biografía completa y detallada
- **Generación de imágenes**: Crea retratos únicos de tus personajes usando IA avanzada
- **Gestión de personajes**: Guarda, organiza y comparte tus creaciones
- **Interfaz moderna**: Diseño elegante con tema claro/oscuro
- **Sistema de usuarios**: Registro, login y perfiles de usuario
- **Galería pública**: Explora personajes creados por otros usuarios

---

## 🛠️ Tecnologías Utilizadas

### Frontend (Interfaz de Usuario)
- **Next.js 15**: Framework de React para aplicaciones web modernas
- **React 18**: Biblioteca para crear interfaces de usuario
- **TypeScript**: JavaScript con tipos para mayor seguridad
- **Tailwind CSS**: Framework de estilos para diseño responsive
- **shadcn/ui**: Componentes de interfaz elegantes y accesibles
- **Lucide React**: Iconos modernos y minimalistas

### Backend (Servidor y Base de Datos)
- **Firebase**: Plataforma completa de Google para aplicaciones web
  - **Firebase Auth**: Sistema de autenticación de usuarios
  - **Firestore**: Base de datos NoSQL en tiempo real
  - **Firebase Storage**: Almacenamiento de archivos (imágenes)
- **Firebase Admin SDK**: Administración del servidor

### Inteligencia Artificial
- **Google Genkit**: Framework de IA de Google
- **Gemini 1.5 Flash**: Modelo de IA para generar biografías
- **Gemini 2.0 Flash**: Modelo avanzado para generar imágenes

### Desarrollo
- **Node.js**: Entorno de ejecución para JavaScript
- **npm**: Gestor de paquetes
- **ESLint**: Herramienta para detectar errores en el código

---

## 💻 Herramientas Necesarias (100% Gratuitas)

### 1. Editor de Código
**Recomendado: Visual Studio Code** (Gratuito)
- Descarga: https://code.visualstudio.com/
- **Alternativas gratuitas:**
  - Cursor (https://cursor.sh/) - Con IA integrada
  - Sublime Text (versión gratuita)
  - Atom (GitHub)
  - Notepad++ (Windows)

### 2. Node.js y npm
**Node.js** (Incluye npm automáticamente)
- Descarga: https://nodejs.org/
- Versión recomendada: LTS (Long Term Support)
- **Verificar instalación:**
  ```bash
  node --version
  npm --version
  ```

### 3. Git (Control de Versiones)
- Descarga: https://git-scm.com/
- **Alternativas:**
  - GitHub Desktop (interfaz gráfica gratuita)
  - GitKraken (versión gratuita disponible)

### 4. Terminal/Consola
- **Windows**: PowerShell o Command Prompt (incluidos en Windows)
- **Mac**: Terminal (incluido en macOS)
- **Linux**: Terminal (incluido en todas las distribuciones)
- **Alternativa multiplataforma**: Windows Terminal (gratuito en Microsoft Store)

### 5. Navegador Web Moderno
- Google Chrome, Firefox, Safari, Edge (todos gratuitos)

---

## 🚀 Instalación Paso a Paso

### Paso 1: Preparar el Entorno

1. **Instalar Node.js**
   - Ve a https://nodejs.org/
   - Descarga la versión LTS
   - Instala siguiendo las instrucciones del instalador
   - Reinicia tu computadora

2. **Verificar la instalación**
   ```bash
   node --version
   npm --version
   ```
   Deberías ver números de versión (ej: v18.17.0)

3. **Instalar Git** (si no lo tienes)
   - Ve a https://git-scm.com/
   - Descarga e instala para tu sistema operativo

### Paso 2: Obtener el Código

1. **Clonar el repositorio** (si tienes acceso)
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd charaforge
   ```

2. **O descargar el código ZIP**
   - Descarga el archivo ZIP del proyecto
   - Extrae en una carpeta de tu elección
   - Abre terminal en esa carpeta

### Paso 3: Instalar Dependencias

```bash
npm install
```

Este comando descargará todas las librerías necesarias (puede tardar varios minutos).

---

## 🔥 Configuración de Firebase

Firebase es la plataforma que maneja usuarios, base de datos y archivos. Todo es **GRATUITO** hasta ciertos límites muy generosos.

### Paso 1: Crear Cuenta en Google

Si no tienes cuenta de Google, créala en https://accounts.google.com/

### Paso 2: Crear Proyecto Firebase

1. **Ve a Firebase Console**
   - Visita: https://console.firebase.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear nuevo proyecto**
   - Haz clic en "Crear un proyecto"
   - Nombre del proyecto: `charaforge-[tu-nombre]` (ej: charaforge-juan)
   - Acepta los términos y condiciones
   - **Analytics**: Puedes habilitarlo o deshabilitarlo (opcional)
   - Haz clic en "Crear proyecto"

3. **Esperar a que se cree** (1-2 minutos)

### Paso 3: Configurar Authentication (Sistema de Usuarios)

1. **En tu proyecto Firebase:**
   - Ve a "Authentication" en el menú izquierdo
   - Haz clic en "Comenzar"

2. **Configurar proveedores de autenticación:**
   - Ve a la pestaña "Sign-in method"
   - Habilita "Correo electrónico/contraseña"
   - Haz clic en "Guardar"

3. **Configurar dominio autorizado:**
   - En "Dominios autorizados", agrega: `localhost`

### Paso 4: Configurar Firestore (Base de Datos)

1. **Crear base de datos:**
   - Ve a "Firestore Database"
   - Haz clic en "Crear base de datos"

2. **Configurar reglas de seguridad:**
   - Selecciona "Comenzar en modo de prueba"
   - Ubicación: Elige la más cercana a ti
   - Haz clic en "Listo"

3. **Actualizar reglas:**
   - Ve a la pestaña "Reglas"
   - El proyecto ya incluye las reglas correctas en `firestore.rules`

### Paso 5: Configurar Storage (Almacenamiento de Archivos)

1. **Crear bucket de Storage:**
   - Ve a "Storage" en el menú izquierdo
   - Haz clic en "Comenzar"
   - Selecciona "Comenzar en modo de prueba"
   - Ubicación: Usa la misma que Firestore
   - Haz clic en "Listo"

### Paso 6: Obtener Credenciales del Proyecto

1. **Configuración del proyecto web:**
   - Ve a "Configuración del proyecto" (ícono de engranaje)
   - Baja hasta "Tus aplicaciones"
   - Haz clic en el ícono `</>` (Web)

2. **Registrar aplicación:**
   - Nombre de la aplicación: `CharaForge Web`
   - **NO** marcar "También configurar Firebase Hosting"
   - Haz clic en "Registrar aplicación"

3. **Copiar configuración:**
   - Aparecerá un código como este:
   ```javascript
   const firebaseConfig = {
     apiKey: "tu-api-key",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto-id",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
   - **¡GUARDA ESTOS VALORES!** Los necesitarás después

### Paso 7: Crear Clave de Cuenta de Servicio

1. **Ir a configuración:**
   - En "Configuración del proyecto"
   - Ve a la pestaña "Cuentas de servicio"

2. **Generar clave privada:**
   - Haz clic en "Generar nueva clave privada"
   - Se descargará un archivo JSON
   - **¡GUARDA ESTE ARCHIVO!** Lo necesitarás después

---

## 🤖 Configuración de Google AI

Para las funciones de IA necesitas una clave API de Google AI Studio.

### Paso 1: Obtener API Key de Google AI

1. **Ve a Google AI Studio:**
   - Visita: https://aistudio.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear API Key:**
   - Haz clic en "Get API key"
   - Selecciona "Create API key in new project" o usa un proyecto existente
   - Copia la clave que se genera

3. **Límites gratuitos:**
   - Gemini 1.5 Flash: 15 solicitudes por minuto
   - Gemini 2.0 Flash: 10 solicitudes por minuto
   - Esto es suficiente para desarrollo y uso personal

---

## ⚙️ Variables de Entorno

Las variables de entorno son configuraciones que le dicen a la aplicación cómo conectarse a los servicios.

### Paso 1: Crear archivo .env

En la carpeta raíz del proyecto, crea un archivo llamado `.env` (sin extensión).

### Paso 2: Agregar configuraciones

Copia este contenido al archivo `.env` y reemplaza los valores:

```env
# ===== CONFIGURACIÓN FIREBASE (CLIENTE) =====
# Obtén estos valores de tu configuración web de Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key-aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ===== CONFIGURACIÓN FIREBASE (SERVIDOR) =====
# Este es el contenido completo del archivo JSON de cuenta de servicio
# IMPORTANTE: Debe estar en UNA SOLA LÍNEA
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto",...todo-el-json-en-una-linea...}

# ===== CONFIGURACIÓN GOOGLE AI =====
# Tu clave API de Google AI Studio
GOOGLE_AI_API_KEY=tu-google-ai-api-key

# ===== CONFIGURACIÓN OPCIONAL =====
# Para usar emuladores en desarrollo (recomendado para principiantes)
NEXT_PUBLIC_USE_EMULATORS=false
```

### Paso 3: Configurar FIREBASE_SERVICE_ACCOUNT_KEY

Este paso es **CRÍTICO**. El archivo JSON debe convertirse a una sola línea:

1. **Abrir archivo JSON descargado:**
   - Abre el archivo de cuenta de servicio en un editor de texto
   - Verás algo como:
   ```json
   {
     "type": "service_account",
     "project_id": "tu-proyecto",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     ...
   }
   ```

2. **Convertir a una línea:**
   - Opción 1: Usar herramientas online como "JSON to single line converter"
   - Opción 2: Reemplazar manualmente todos los saltos de línea
   - Resultado: `{"type":"service_account","project_id":"tu-proyecto",...}`

3. **Pegar en .env:**
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...todo-en-una-linea...}
   ```

### Paso 4: Verificar Configuración

```bash
npm run firebase:setup
```

Este comando verificará que todas las variables estén correctas.

---

## 🎮 Ejecutar la Aplicación

### Paso 1: Verificar Todo Esté Listo

```bash
# Verificar Node.js
node --version

# Verificar dependencias
npm list --depth=0

# Verificar configuración Firebase
npm run firebase:setup
```

### Paso 2: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

### Paso 3: Abrir en Navegador

- Ve a: http://localhost:9002
- Deberías ver la página principal de CharaForge

### Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Inicia servidor de desarrollo
npm run build                  # Construye para producción
npm run start                  # Inicia servidor de producción
npm run lint                   # Verifica errores de código

# Firebase
npm run firebase:setup         # Verifica configuración
npm run firebase:emulators     # Inicia emuladores locales

# Administración
npm run admin:grant -- <uid>   # Da permisos de admin
npm run admin:list             # Lista administradores
```

---

## 🌟 Características de la Aplicación

### Página Principal
- **Galería de personajes destacados**: Muestra los últimos personajes públicos
- **Navegación intuitiva**: Acceso rápido a todas las funciones
- **Tema claro/oscuro**: Botón para cambiar apariencia

### Generador de Personajes (`/character-generator`)
1. **Descripción del personaje**: Escribe una breve descripción
2. **Generación de biografía**: IA crea historia detallada
3. **Generación de imagen**: IA crea retrato del personaje
4. **Guardado**: Almacena personaje en tu perfil

### Gestión de Personajes (`/characters`)
- **Mis personajes**: Lista todos tus personajes creados
- **Editar/Eliminar**: Modifica o borra personajes
- **Privacidad**: Cambia entre público/privado

### Sistema de Usuarios
- **Registro**: Crear cuenta con email/contraseña
- **Login/Logout**: Iniciar y cerrar sesión
- **Perfil**: Ver y editar información personal

### Panel de Administración (`/admin`)
- **Solo para administradores**
- **Gestión de usuarios**: Ver todos los usuarios registrados
- **Estadísticas**: Información sobre uso de la aplicación

---

## 👑 Administración de Usuarios

### Crear Primer Administrador

Después de registrar tu primer usuario:

1. **Obtener UID del usuario:**
   - Ve a Firebase Console > Authentication
   - Encuentra tu usuario y copia el "UID"

2. **Asignar rol de administrador:**
   ```bash
   npm run admin:grant -- tu-uid-aqui
   ```

3. **Verificar:**
   ```bash
   npm run admin:check -- tu-uid-aqui
   ```

### Comandos de Administración

```bash
# Dar permisos de admin
npm run admin:grant -- uid-del-usuario

# Quitar permisos de admin
npm run admin:revoke -- uid-del-usuario

# Verificar si es admin
npm run admin:check -- uid-del-usuario

# Listar todos los admins
npm run admin:list
```

---

## 🔧 Solución de Problemas

### Error: "Firebase not configured"
```bash
# Verificar variables de entorno
npm run firebase:setup

# Si hay errores, revisar archivo .env
```

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY"
- El JSON debe estar en UNA SOLA LÍNEA
- Sin saltos de línea dentro del valor
- Usar herramientas online para convertir JSON a línea única

### Error: "Google AI API key invalid"
- Verificar que la clave sea correcta en .env
- Asegurarse de que esté habilitada en Google AI Studio

### Error: "Port 9002 already in use"
```bash
# Usar puerto diferente
npm run dev -- -p 3000

# O encontrar y terminar proceso que usa puerto 9002
# Windows
netstat -ano | findstr 9002
taskkill /PID [numero-proceso] /F

# Mac/Linux
lsof -ti:9002 | xargs kill
```

### Error de dependencias
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Authentication failed"
- Verificar que Firebase Auth esté habilitado
- Verificar dominio autorizado (localhost)

### Error al generar imágenes/biografías
- Verificar cuota de API de Google AI
- Verificar conectividad a internet
- Revisar logs en consola del navegador

---

## 🚀 Despliegue (Opcional)

### Opciones Gratuitas para Desplegar

#### 1. Vercel (Recomendado)
- **Límites gratuitos**: 100GB ancho de banda/mes
- **Pasos:**
  1. Crear cuenta en https://vercel.com/
  2. Conectar repositorio GitHub
  3. Configurar variables de entorno en Vercel
  4. Deploy automático

#### 2. Netlify
- **Límites gratuitos**: 100GB ancho de banda/mes
- **Pasos similares a Vercel**

#### 3. Firebase Hosting
- **Límites gratuitos**: 10GB almacenamiento, 360MB/día transferencia
- **Comandos:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Configuración para Producción

1. **Variables de entorno en plataforma de despliegue**
2. **Actualizar dominios autorizados en Firebase**
3. **Configurar CORS si es necesario**
4. **Optimizar imágenes y recursos**

---

## 📚 Recursos Adicionales

### Documentación Oficial
- **Next.js**: https://nextjs.org/docs
- **Firebase**: https://firebase.google.com/docs
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

### Tutoriales en Español
- **Firebase para principiantes**: Canal YouTube "Fazt"
- **React desde cero**: Canal YouTube "MoureDev"
- **Next.js tutorial**: Canal YouTube "Gentleman Programming"

### Comunidades
- **Discord React en Español**
- **Reddit**: r/webdev, r/reactjs
- **Stack Overflow en Español**

### Herramientas Útiles Gratuitas
- **Figma**: Diseño de interfaces
- **Canva**: Crear imágenes y logos
- **Unsplash**: Imágenes gratuitas
- **Google Fonts**: Fuentes tipográficas
- **Color Hunt**: Paletas de colores

---

## 🎉 ¡Felicitaciones!

Si has llegado hasta aquí, ya tienes CharaForge funcionando completamente. Puedes:

1. **Crear tu primer personaje** con IA
2. **Experimentar con diferentes descripciones**
3. **Personalizar la aplicación** según tus necesidades
4. **Invitar a amigos** a usar tu instancia
5. **Contribuir al proyecto** con mejoras

### Próximos Pasos Sugeridos

1. **Personalizar estilos**: Modifica colores y fuentes en `tailwind.config.ts`
2. **Agregar funcionalidades**: Implementa nuevas características
3. **Optimizar rendimiento**: Analiza y mejora velocidad
4. **Agregar más modelos de IA**: Experimenta con diferentes APIs
5. **Crear documentación adicional**: Ayuda a otros usuarios

---

**¿Necesitas ayuda?** 
- Revisa la sección de [Solución de Problemas](#solución-de-problemas)
- Consulta los logs en la consola del navegador (F12)
- Verifica que todos los servicios estén correctamente configurados

¡Disfruta creando personajes increíbles con CharaForge! 🚀✨