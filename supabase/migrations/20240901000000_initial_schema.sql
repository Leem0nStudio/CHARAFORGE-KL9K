-- 1. Tabla para perfiles de usuario
-- Esta tabla se conectará con la tabla de autenticación de Supabase.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Tabla para personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Campos denormalizados para búsquedas e índices
    name TEXT,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Columnas JSONB para datos anidados
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    sync_status TEXT,
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla para "likes"
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);


-- 6. Tabla para comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla para elencos de historias (Story Casts)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla de seguimiento (Follows)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);


-- 9. Tabla de artículos
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Habilitar RLS para todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_casts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Users: Los usuarios pueden ver todos los perfiles, pero solo pueden actualizar el suyo.
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Characters: Los usuarios pueden ver personajes públicos, y pueden hacer todo en los suyos.
CREATE POLICY "Public characters are viewable by everyone." ON public.characters FOR SELECT USING ( (meta_details->>'status') = 'public' );
CREATE POLICY "Users can view their own characters." ON public.characters FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert their own characters." ON public.characters FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update their own characters." ON public.characters FOR UPDATE USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete their own characters." ON public.characters FOR DELETE USING ( auth.uid() = user_id );

-- Likes: Los usuarios pueden ver todos los likes y gestionar los suyos.
CREATE POLICY "Likes are viewable by everyone." ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comentarios: Los usuarios pueden ver todos los comentarios y gestionar los suyos.
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments." ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- DataPacks: Visibles para todos, solo los admins pueden crear/actualizar. (Simplificado para el inicio)
CREATE POLICY "DataPacks are viewable by everyone." ON public.datapacks FOR SELECT USING (true);
CREATE POLICY "Admins can manage datapacks." ON public.datapacks FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- AI Models: Misma lógica que los DataPacks.
CREATE POLICY "AI Models are viewable by everyone." ON public.ai_models FOR SELECT USING (true);
CREATE POLICY "Admins can manage system AI models." ON public.ai_models FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND user_id IS NULL );
CREATE POLICY "Users can manage their own AI models." ON public.ai_models FOR ALL USING ( auth.uid() = user_id );

-- Follows: Los usuarios pueden ver todos los follows y gestionar los suyos.
CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can insert their own follows." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Story Casts: Los usuarios solo pueden gestionar los suyos.
CREATE POLICY "Users can manage their own story casts." ON public.story_casts FOR ALL USING (auth.uid() = user_id);

-- Articles: Los artículos publicados son visibles, pero solo el autor puede gestionar los suyos.
CREATE POLICY "Published articles are viewable by everyone." ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage their own articles." ON public.articles FOR ALL USING (auth.uid() = user_id);

-- Función para obtener los creadores top
CREATE OR REPLACE FUNCTION get_top_creators()
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    photo_url TEXT,
    stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.display_name,
        u.photo_url,
        u.stats
    FROM
        public.users u
    WHERE
        (u.preferences->>'profileVisibility' = 'public')
    ORDER BY
        (u.stats->>'charactersCreated')::int DESC NULLS LAST
    LIMIT 4;
END;
$$ LANGUAGE plpgsql;
