-- Crear tabla de datapacks
CREATE TABLE public.datapacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    author_id UUID REFERENCES public.users(id),
    version TEXT DEFAULT '1.0.0',
    schema JSONB,
    prompt_templates JSONB,
    is_public BOOLEAN DEFAULT false,
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Allow users to view public datapacks" ON public.datapacks
    FOR SELECT USING (is_public = true OR is_official = true);

CREATE POLICY "Allow users to manage their own datapacks" ON public.datapacks
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Allow admins to manage all datapacks" ON public.datapacks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Crear tabla de follows para funcionalidad social
CREATE TABLE public.follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

-- Habilitar RLS para follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Políticas para follows
CREATE POLICY "Allow users to view follows" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- Crear tabla de likes
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, character_id)
);

-- Habilitar RLS para likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Políticas para likes
CREATE POLICY "Allow users to view likes" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own likes" ON public.likes
    FOR ALL USING (auth.uid() = user_id);

-- Crear tabla de comentarios
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para comentarios
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Políticas para comentarios
CREATE POLICY "Allow users to view comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Allow users to manage their own comments" ON public.comments
    FOR ALL USING (auth.uid() = user_id);

-- Crear tabla de artículos
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para artículos
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Políticas para artículos
CREATE POLICY "Allow users to view published articles" ON public.articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Allow users to manage their own articles" ON public.articles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to manage all articles" ON public.articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );