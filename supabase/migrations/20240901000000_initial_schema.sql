
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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Tabla para DataPacks
-- Contiene los paquetes de datos para generar personajes.
CREATE TABLE IF NOT EXISTS public.datapacks (
    id TEXT PRIMARY KEY, -- Cambiado de UUID a TEXT
    user_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image_url TEXT,
    type TEXT,
    price NUMERIC,
    tags TEXT[],
    schema_details JSONB,
    is_nsfw BOOLEAN DEFAULT false,
    is_imported BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DataPacks are viewable by everyone." ON public.datapacks FOR SELECT USING (true);
CREATE POLICY "Users can insert their own datapacks." ON public.datapacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own datapacks." ON public.datapacks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own datapacks." ON public.datapacks FOR DELETE USING (auth.uid() = user_id);

-- 3. Tabla para Personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    -- JSONB para detalles complejos
    core_details JSONB,
    visual_details JSONB,
    lineage_details JSONB,
    generation_details JSONB,
    meta_details JSONB,
    settings_details JSONB,
    rpg_details JSONB,
    -- Referencia al DataPack usado
    datapack_id TEXT REFERENCES public.datapacks(id), -- Cambiado de UUID a TEXT
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Characters are viewable by everyone." ON public.characters FOR SELECT USING (true);
CREATE POLICY "Users can create characters." ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters." ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters." ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- 4. Tabla para Modelos de IA
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    type TEXT, -- 'model' o 'lora'
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI Models are viewable by everyone." ON public.ai_models FOR SELECT USING (true);
CREATE POLICY "Users can add their own models." ON public.ai_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own models." ON public.ai_models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own models." ON public.ai_models FOR DELETE USING (auth.uid() = user_id);

-- 5. Tabla para "Likes"
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID REFERENCES public.characters(id),
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (character_id, user_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone." ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes." ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 6. Tabla para "Comentarios"
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT, -- 'character', 'datapack', etc.
    entity_id TEXT,
    user_id UUID REFERENCES public.users(id),
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments." ON public.comments FOR UPDATE USING (auth.uid() = user_id);

-- 7. Tabla para "Seguidores" (Follows)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.users(id),
    following_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow." ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- 8. Tabla para "Elencos de Historias" (Story Casts)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.story_casts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own story casts." ON public.story_casts FOR ALL USING (auth.uid() = user_id);

-- 9. Tabla para "Artículos"
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    slug TEXT UNIQUE,
    title TEXT,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are viewable by everyone." ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage their own articles." ON public.articles FOR ALL USING (auth.uid() = user_id);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON public.characters(meta_details->>'status');
CREATE INDEX IF NOT EXISTS idx_datapacks_user_id ON public.datapacks(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON public.comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);

-- Función para manejar la creación de perfiles de usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un nuevo usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función para permitir la eliminación de cuentas
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Eliminar datos de la tabla pública
  DELETE FROM public.users WHERE id = auth.uid();
  -- Eliminar usuario de la tabla de autenticación
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
