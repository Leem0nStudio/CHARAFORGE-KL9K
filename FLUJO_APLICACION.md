# 🔄 Flujo de Uso de CharaForge

## Diagrama General del Flujo de la Aplicación

```mermaid
graph TD
    A[Usuario Accede] --> B{¿Está Autenticado?}
    B -->|No| C[Página de Login]
    B -->|Sí| D[Dashboard Principal]
    
    C --> E[Firebase Auth]
    E --> F[Set HTTPOnly Cookie]
    F --> D
    
    D --> G[Menú Principal]
    G --> H[Generador de Personajes]
    G --> I[Galería de Personajes]
    G --> J[DataPacks]
    G --> K[Perfil de Usuario]
    G --> L[Panel de Admin]
    
    H --> M[Formulario de Generación]
    M --> N{¿Usar DataPack?}
    N -->|Sí| O[Selector de DataPack]
    N -->|No| P[Descripción Manual]
    
    O --> Q[Wizard del DataPack]
    P --> R[Descripción Libre]
    
    Q --> S[Generación de Bio]
    R --> S
    
    S --> T[AI Text Engine]
    T --> U{¿Generar Imagen?}
    U -->|Sí| V[Configuración de Imagen]
    U -->|No| W[Guardar Personaje]
    
    V --> X[Selector de Modelo]
    X --> Y{¿Tipo de Motor?}
    Y -->|Hugging Face| Z[HF Inference API]
    Y -->|Gemini| AA[Google Gemini API]
    Y -->|OpenRouter| BB[OpenRouter API]
    Y -->|Custom Endpoint| CC[Stable Diffusion Personalizado]
    Y -->|Vertex AI| DD[Google Vertex AI]
    
    Z --> EE[Imagen Generada]
    AA --> EE
    BB --> EE
    CC --> EE
    DD --> EE
    
    EE --> W
    W --> FF[Firestore Database]
    FF --> GG[Galería Personal]
    
    I --> HH[Ver Personajes]
    HH --> II[Editar/Compartir]
    II --> JJ[Cambiar Status]
    JJ --> KK[Actualizar Base de Datos]
    
    J --> LL[Explorar DataPacks]
    LL --> MM[Usar DataPack]
    MM --> M
    
    K --> NN[Configuración de Perfil]
    NN --> OO[API Keys Personales]
    OO --> PP[Preferencias]
    
    L --> QQ[Gestión de Contenido]
    QQ --> RR[Crear/Editar DataPacks]
    QQ --> SS[Gestionar Usuarios]
    QQ --> TT[Configurar Modelos AI]
```

## 🔐 Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as Cliente
    participant F as Firebase Auth
    participant S as Servidor
    participant DB as Firestore
    
    U->>C: Hace clic en Login
    C->>F: Firebase.signInWithPopup()
    F->>C: ID Token
    C->>S: POST /api/auth/set-cookie
    S->>C: HTTPOnly Cookie
    C->>S: Server Action (verifyAndGetUid)
    S->>DB: Verificar Token
    DB->>S: Datos del Usuario
    S->>C: Respuesta Autenticada
```

## 🤖 Flujo de Generación de Personajes

```mermaid
flowchart TD
    A[Inicio Generación] --> B[Validar Input]
    B --> C{¿Input Válido?}
    C -->|No| D[Error de Validación]
    C -->|Sí| E[Verificar Autenticación]
    
    E --> F{¿Usuario Autenticado?}
    F -->|No| G[Generación Anónima]
    F -->|Sí| H[Obtener Perfil Usuario]
    
    H --> I[Configurar Motor AI]
    I --> J[Generar Bio del Personaje]
    J --> K{¿Generación Exitosa?}
    K -->|No| L[Error de Generación]
    K -->|Sí| M[Mostrar Resultado]
    
    M --> N{¿Generar Imagen?}
    N -->|No| O[Guardar Solo Bio]
    N -->|Sí| P[Configurar Motor de Imagen]
    
    P --> Q{¿Tipo de Motor?}
    Q -->|Hugging Face| R[HF Inference API]
    Q -->|Gemini| S[Google Gemini]
    Q -->|OpenRouter| T[OpenRouter API]
    Q -->|Custom| U[Endpoint Personalizado]
    Q -->|Vertex AI| V[Google Vertex AI]
    
    U --> W[Configurar URL Personalizada]
    W --> X[Validar Endpoint]
    X --> Y{¿Endpoint Válido?}
    Y -->|No| Z[Error de Endpoint]
    Y -->|Sí| AA[Generar Imagen]
    
    R --> AA
    S --> AA
    T --> AA
    V --> AA
    
    AA --> BB{¿Imagen Generada?}
    BB -->|No| CC[Error de Imagen]
    BB -->|Sí| DD[Subir a Firebase Storage]
    
    DD --> EE[Guardar Personaje Completo]
    EE --> FF[Redirigir a Galería]
```

## 🎨 Flujo de Vertex AI Model Garden (NUEVO)

```mermaid
flowchart TD
    A[Seleccionar Modelo Vertex AI] --> B[Configurar Endpoint ID]
    B --> C{¿Endpoint ID Configurado?}
    C -->|No| D[Error: Endpoint ID Requerido]
    C -->|Sí| E[Validar Configuración]
    
    E --> F[Obtener Project ID del Service Account]
    F --> G[Construir URL de Vertex AI]
    G --> H[Autenticar con Google Cloud]
    
    H --> I{¿Autenticación Exitosa?}
    I -->|No| J[Error de Autenticación]
    I -->|Sí| K[Preparar Payload]
    
    K --> L[Configurar Parámetros SD]
    L --> M[Incluir LoRA si está configurado]
    M --> N[Enviar Request a Vertex AI]
    
    N --> O{¿Response Válido?}
    O -->|No| P[Error de Response]
    O -->|Sí| Q[Procesar Imagen Base64]
    
    Q --> R[Convertir a Data URI]
    R --> S[Imagen Generada]
    S --> T[Mostrar en UI]
    T --> U[Guardar en Base de Datos]
```

## 🔧 Flujo de Configuración de Vertex AI

```mermaid
flowchart TD
    A[Configurar Google Cloud] --> B[Habilitar Vertex AI API]
    B --> C[Crear Service Account]
    C --> D[Asignar Permisos IAM]
    
    D --> E[Desplegar Modelo en Endpoint]
    E --> F[Obtener Endpoint ID]
    F --> G[Configurar en CharaForge]
    
    G --> H[Editar vertex-ai-config.ts]
    H --> I[Actualizar Endpoint ID]
    I --> J[Configurar Parámetros por Defecto]
    J --> K[Reiniciar Aplicación]
    
    K --> L[Probar Generación]
    L --> M{¿Funciona?}
    M -->|No| N[Debug y Ajustar]
    M -->|Sí| O[Configuración Completada]
    
    N --> P[Revisar Logs]
    P --> Q[Verificar Permisos]
    Q --> R[Probar Endpoint]
    R --> L
```

## 📦 Flujo de DataPacks

```mermaid
flowchart TD
    A[Acceso a DataPacks] --> B{¿Es Admin?}
    B -->|No| C[Galería Pública]
    B -->|Sí| D[Panel de Admin]
    
    C --> E[Explorar DataPacks]
    E --> F[Seleccionar DataPack]
    F --> G[Usar en Generador]
    
    D --> H[Gestión de DataPacks]
    H --> I[Crear Nuevo DataPack]
    H --> J[Editar Existente]
    H --> K[Eliminar DataPack]
    
    I --> L[Formulario de Creación]
    L --> M[Definir Schema]
    M --> N[Subir Imagen de Portada]
    N --> O[Guardar en Firestore]
    
    J --> P[Modificar Schema]
    P --> Q[Actualizar Base de Datos]
    
    K --> R[Confirmar Eliminación]
    R --> S[Eliminar de Firestore]
```

## 🔄 Flujo de Versionado y Compartir

```mermaid
flowchart TD
    A[Personaje Creado] --> B[Estado: Privado]
    B --> C{¿Compartir?}
    C -->|No| D[Mantener Privado]
    C -->|Sí| E[Cambiar a Público]
    
    E --> F[Actualizar Status]
    F --> G[Revalidar Rutas]
    G --> H[Aparece en Galería Pública]
    
    H --> I[Otros Usuarios Ven]
    I --> J[Fork/Branch del Personaje]
    J --> K[Nueva Versión]
    K --> L[Modificaciones]
    L --> M[Guardar Nueva Versión]
    
    M --> N[Historial de Versiones]
    N --> O[Comparar Cambios]
```

## 🛡️ Flujo de Seguridad

```mermaid
flowchart TD
    A[Request del Cliente] --> B[Server Action]
    B --> C[verifyAndGetUid]
    C --> D[Leer HTTPOnly Cookie]
    D --> E[Verificar Token Firebase]
    E --> F{¿Token Válido?}
    F -->|No| G[Error de Autenticación]
    F -->|Sí| H[Obtener UID]
    
    H --> I[Validar Input con Zod]
    I --> J{¿Input Válido?}
    J -->|No| K[Error de Validación]
    J -->|Sí| L[Ejecutar Lógica]
    
    L --> M[Verificar Permisos]
    M --> N{¿Tiene Permisos?}
    N -->|No| O[Error de Permisos]
    N -->|Sí| P[Operación en Base de Datos]
    
    P --> Q[Revalidar Rutas]
    Q --> R[Respuesta al Cliente]
```

## 📊 Puntos de Inconsistencia Potenciales

### 1. **Gestión de Estado**
- **Problema**: Uso de `useTransition` y estado local puede causar desincronización
- **Ubicación**: `character-generator.tsx` líneas 95-100
- **Riesgo**: Estado inconsistente entre generación y guardado

### 2. **Validación de Datos**
- **Problema**: Validación duplicada en cliente y servidor
- **Ubicación**: Schemas Zod en múltiples archivos
- **Riesgo**: Inconsistencias entre validaciones

### 3. **Manejo de Errores**
- **Problema**: Diferentes formatos de error en diferentes acciones
- **Ubicación**: `generation.ts`, `character-write.ts`
- **Riesgo**: UX inconsistente en manejo de errores

### 4. **Revalidación de Rutas**
- **Problema**: Revalidación manual inconsistente
- **Ubicación**: Múltiples Server Actions
- **Riesgo**: Cache desactualizado

### 5. **Gestión de Archivos**
- **Problema**: Lógica de upload dispersa
- **Ubicación**: `storage.ts` vs Server Actions
- **Riesgo**: Inconsistencias en manejo de archivos

### 6. **Autenticación**
- **Problema**: Verificación de autenticación en múltiples puntos
- **Ubicación**: `verifyAndGetUid` en cada acción
- **Riesgo**: Lógica duplicada y posible inconsistencia

### 7. **Endpoints Personalizados (NUEVO)**
- **Problema**: Validación de endpoints personalizados no centralizada
- **Ubicación**: `custom-endpoints.ts` y `character-image/flow.ts`
- **Riesgo**: Inconsistencias en configuración y manejo de errores

## 🎯 Recomendaciones para Mejorar Consistencia

1. **Centralizar Gestión de Estado**: Usar un store global (Zustand/Redux)
2. **Estandarizar Validación**: Crear validadores reutilizables
3. **Unificar Manejo de Errores**: Implementar sistema de errores consistente
4. **Automatizar Revalidación**: Usar middleware de revalidación
5. **Consolidar Lógica de Archivos**: Centralizar en servicios únicos
6. **Implementar Middleware de Auth**: Verificación automática en rutas protegidas
7. **Centralizar Configuración de Endpoints**: Sistema unificado para gestión de endpoints personalizados
8. **Validación Automática de Endpoints**: Health checks automáticos para endpoints personalizados