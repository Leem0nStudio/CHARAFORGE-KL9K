-- 1. Tabla para perfiles de usuario
-- Esta tabla se conectará con la tabla de autenticación de Supabase.
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    -- Añadimos columnas JSONB para datos flexibles
    stats JSONB,
    preferences JSONB,
    profile JSONB
);

-- 2. Tabla de Personajes (Characters)
-- Optimizada para consultas JSONB
CREATE TABLE public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    -- Usamos JSONB para datos semi-estructurados, es muy potente
    core_details JSONB,
    visual_details JSONB,
    lineage_details JSONB,
    generation_details JSONB,
    meta_details JSONB,
    settings_details JSONB,
    rpg_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilita Políticas de Seguridad (Row Level Security)
-- ¡CRÍTICO PARA LA SEGURIDAD! Por defecto, nadie puede acceder a las tablas.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- 4. Crea las Políticas de Acceso
-- Los usuarios pueden ver su propio perfil.
CREATE POLICY "Allow users to view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil.
CREATE POLICY "Allow users to update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Los usuarios pueden ver sus propios personajes.
CREATE POLICY "Allow users to CRUD their own characters" ON public.characters
    FOR ALL USING (auth.uid() = user_id);

-- Cualquiera puede ver los personajes públicos.
CREATE POLICY "Allow anyone to view public characters" ON public.characters
    FOR SELECT USING ((meta_details->>'status') = 'public');
