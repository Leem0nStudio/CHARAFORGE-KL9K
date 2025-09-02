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

-- 2. Tabla para DataPacks
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

-- 3. Tabla para los personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    -- Campos JSONB para datos anidados
    core_details JSONB,
    visual_details JSONB,
    lineage_details JSONB,
    generation_details JSONB,
    meta_details JSONB,
    settings_details JSONB,
    rpg_details JSONB
);

-- 4. Tabla para los modelos de IA
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
    sync_status TEXT DEFAULT 'notsynced',
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB
);

-- 5. Tabla para los "Me Gusta" (Likes)
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);

-- 6. Tabla para los comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT, -- 'character', 'datapack', 'article'
    entity_id TEXT,
    user_id UUID REFERENCES public.users(id),
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 7. Tabla para "Casts" de historias
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 8. Tabla para seguimientos (Follows)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 9. Tabla para Artículos/Noticias
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);


-- Habilitar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_casts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;


-- Políticas de seguridad para la tabla `users`
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Políticas para `characters`
CREATE POLICY "Users can view their own characters." ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public characters are viewable by everyone." ON public.characters FOR SELECT USING ((meta_details->>'status' = 'public'));
CREATE POLICY "Users can insert their own characters." ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters." ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters." ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Políticas para `likes`, `comments`, `story_casts`, `follows`
CREATE POLICY "Enable read access for all users" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for users based on user_id" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on user_id" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own story casts" ON public.story_casts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Políticas para `datapacks` y `ai_models` (lectura pública, escritura para admins/dueños)
CREATE POLICY "Enable read access for all users" ON public.datapacks FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.ai_models FOR SELECT USING (true);
CREATE POLICY "Users can manage their own models" ON public.ai_models FOR ALL USING (auth.uid() = user_id);

-- Políticas para `articles`
CREATE POLICY "Published articles are viewable by everyone." ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage their own articles." ON public.articles FOR ALL USING (auth.uid() = user_id);


-- Nueva función SQL para obtener los mejores creadores
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
        u.preferences->'privacy'->>'profileVisibility' = 'public'
    ORDER BY
        (u.stats->>'charactersCreated')::INT DESC NULLS LAST
    LIMIT 4;
END;
$$ LANGUAGE plpgsql;
