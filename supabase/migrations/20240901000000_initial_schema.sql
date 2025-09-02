-- 1. Tabla para perfiles de usuario
-- Esta tabla se conectará con la tabla de autenticación de Supabase.
CREATE TABLE IF NOT EXISTS public.users (
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

-- 2. Tabla para los DataPacks
CREATE TABLE IF NOT EXISTS public.datapacks (
    id TEXT PRIMARY KEY, -- Cambiado de UUID a TEXT
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image_url TEXT,
    type TEXT,
    price NUMERIC,
    tags TEXT[],
    schema_details JSONB,
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_imported BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 3. Tabla principal de personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    data_pack_id TEXT REFERENCES public.datapacks(id) ON DELETE SET NULL, -- Cambiado de UUID a TEXT
    -- Detalles en formato JSONB para flexibilidad
    core_details JSONB,
    visual_details JSONB,
    meta_details JSONB,
    lineage_details JSONB,
    settings_details JSONB,
    generation_details JSONB,
    rpg_details JSONB
);

-- 4. Tabla para modelos de IA
CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    engine TEXT,
    hf_id TEXT,
    civitai_model_id TEXT,
    modelslab_model_id TEXT,
    version_id TEXT,
    base_model TEXT,
    cover_media_url TEXT,
    cover_media_type TEXT,
    trigger_words TEXT[],
    versions_data JSONB,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    sync_status TEXT,
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB
);


-- 5. Tabla de 'Likes' para personajes
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);

-- 6. Tabla de 'Follows' para usuarios
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);


-- 7. Tabla de Comentarios
CREATE TYPE public.comment_entity_type AS ENUM ('character', 'datapack', 'article');
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type public.comment_entity_type NOT NULL,
    entity_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 8. Tabla de Elencos para Historias (Story Casts)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);


-- 9. Tabla de Artículos
CREATE TYPE public.article_status AS ENUM ('draft', 'published');
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    title TEXT,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status public.article_status DEFAULT 'draft',
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS characters_user_id_idx ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS datapacks_user_id_idx ON public.datapacks(user_id);
CREATE INDEX IF NOT EXISTS comments_entity_idx ON public.comments(entity_type, entity_id);

-- Habilitar Row Level Security (RLS) en las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_casts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;


-- Políticas de seguridad
-- Users: Los usuarios pueden ver todos los perfiles (si son públicos), pero solo pueden actualizar el suyo.
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Characters: Los usuarios pueden ver personajes públicos, y pueden hacer todo con los suyos.
CREATE POLICY "Public characters are viewable by everyone." ON public.characters FOR SELECT USING ((meta_details->>'status'::text) = 'public');
CREATE POLICY "Users can view their own private characters." ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create characters." ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters." ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters." ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- DataPacks: Todos los DataPacks son públicos por ahora
CREATE POLICY "DataPacks are viewable by everyone." ON public.datapacks FOR SELECT USING (true);
CREATE POLICY "Admin users can insert datapacks" ON public.datapacks FOR INSERT WITH CHECK (true); -- Se debería restringir a admin
CREATE POLICY "Admin users can update datapacks" ON public.datapacks FOR UPDATE USING (true); -- Se debería restringir a admin
CREATE POLICY "Admin users can delete datapacks" ON public.datapacks FOR DELETE USING (true); -- Se debería restringir a admin


-- Likes: Los usuarios pueden dar y quitar like
CREATE POLICY "Likes are public." ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: Los usuarios pueden ver, crear y borrar sus propios comentarios.
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);


-- Story Casts: Los usuarios solo pueden manejar sus propios elencos.
CREATE POLICY "Users can manage their own story casts." ON public.story_casts FOR ALL USING (auth.uid() = user_id);

-- Articles: Los artículos publicados son públicos. Los borradores solo los ve el autor.
CREATE POLICY "Published articles are viewable by everyone." ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Users can view their own draft articles." ON public.articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create articles." ON public.articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own articles." ON public.articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own articles." ON public.articles FOR DELETE USING (auth.uid() = user_id);

-- AI Models: Los modelos de sistema son públicos, los modelos de usuario son privados.
CREATE POLICY "System models are viewable by everyone." ON public.ai_models FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can view their own custom models." ON public.ai_models FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own custom models." ON public.ai_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom models." ON public.ai_models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom models." ON public.ai_models FOR DELETE USING (auth.uid() = user_id);
