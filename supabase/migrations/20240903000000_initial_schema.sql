
-- ### CharaForge Initial Schema ###
-- This schema sets up all the necessary tables, relationships, and security policies
-- for the CharaForge application to run on Supabase.

-- 1. Enable the required "uuid-ossp" extension for UUID generation
create extension if not exists "uuid-ossp" with schema extensions;

-- 2. Users Table
-- This table stores public user profile information and is linked to the auth.users table.
create table public.users (
  id uuid not null primary key,
  updated_at timestamp with time zone,
  display_name text,
  photo_url text,
  role text default 'user',
  profile jsonb,
  stats jsonb,
  preferences jsonb
);

-- Link to auth.users table
alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade;

-- Function to create a public user profile when a new user signs up in auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name, email, photo_url, role, stats, preferences)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    new.email,
    new.raw_user_meta_data->>'photo_url',
    'user',
    '{"charactersCreated": 0, "totalLikes": 0, "followers": 0, "following": 0, "installedPacks": [], "installedModels": [], "subscriptionTier": "free", "memberSince": extract(epoch from now())*1000}'::jsonb,
    '{"theme": "system", "notifications": {"email": true}, "privacy": {"profileVisibility": "public"}}'::jsonb
  );
  return new;
end;
$$;

-- Trigger to execute the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Characters Table
create table public.characters (
  id uuid not null default extensions.uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null,
  name text,
  archetype text,
  biography text,
  image_url text,
  core_details jsonb,
  visual_details jsonb,
  lineage_details jsonb,
  generation_details jsonb,
  meta_details jsonb,
  settings_details jsonb,
  rpg_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. DataPacks Table
create table public.datapacks (
    id text not null primary key,
    user_id uuid references public.users(id) on delete set null,
    name text not null,
    author text,
    description text,
    cover_image_url text,
    type text not null default 'free',
    price numeric default 0,
    tags text[],
    schema_details jsonb,
    is_nsfw boolean default false,
    is_imported boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. AI Models Table
create table public.ai_models (
    id text not null primary key,
    user_id uuid references public.users(id) on delete cascade,
    name text not null,
    type text not null,
    engine text not null,
    hf_id text,
    civitai_model_id text,
    modelslab_model_id text,
    version_id text,
    base_model text,
    cover_media_url text,
    cover_media_type text default 'image',
    trigger_words text[],
    versions_data jsonb,
    sync_status text default 'notsynced',
    sync_error text,
    gcs_uri text,
    vertex_ai_alias text,
    api_url text,
    comfy_workflow jsonb,
    mix_recipe jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Likes Table (Many-to-Many)
create table public.likes (
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (character_id, user_id)
);

-- 7. Comments Table
create table public.comments (
    id uuid not null default extensions.uuid_generate_v4() primary key,
    entity_id text not null,
    entity_type text not null,
    user_id uuid not null references public.users(id) on delete cascade,
    user_name text,
    user_photo_url text,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_comments_entity on public.comments(entity_id, entity_type);


-- 8. Follows Table (Many-to-Many)
create table public.follows (
    follower_id uuid not null references public.users(id) on delete cascade,
    following_id uuid not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (follower_id, following_id)
);

-- 9. Story Casts Table
create table public.story_casts (
    id uuid not null default extensions.uuid_generate_v4() primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null,
    description text,
    character_ids uuid[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Articles Table
create table public.articles (
    id uuid not null default extensions.uuid_generate_v4() primary key,
    slug text not null unique,
    title text not null,
    content text not null,
    excerpt text,
    status text not null default 'draft',
    user_id uuid not null references public.users(id) on delete cascade,
    author_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ### Row Level Security (RLS) Policies ###
-- Enable RLS for all relevant tables
alter table public.users enable row level security;
alter table public.characters enable row level security;
alter table public.datapacks enable row level security;
alter table public.ai_models enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.story_casts enable row level security;
alter table public.articles enable row level security;


-- Policies for 'users' table
create policy "Public user profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can update their own profile." on public.users for update using (auth.uid() = id);

-- Policies for 'characters' table
create policy "Public characters are viewable by everyone." on public.characters for select using (((meta_details ->> 'status'::text) = 'public'::text));
create policy "Users can view their own private characters." on public.characters for select using (auth.uid() = user_id);
create policy "Users can create their own characters." on public.characters for insert with check (auth.uid() = user_id);
create policy "Users can update their own characters." on public.characters for update using (auth.uid() = user_id);
create policy "Users can delete their own characters." on public.characters for delete using (auth.uid() = user_id);

-- Policies for 'datapacks' and 'ai_models' (assuming public read)
create policy "DataPacks are viewable by everyone." on public.datapacks for select using (true);
create policy "AI Models are viewable by everyone." on public.ai_models for select using (true);
-- Admin-only write policies for system-level datapacks/models
create policy "Admins can create/update system datapacks." on public.datapacks for all using (
    (select role from public.users where id = auth.uid()) = 'admin' AND user_id is null
);
create policy "Admins can create/update system models." on public.ai_models for all using (
    (select role from public.users where id = auth.uid()) = 'admin' AND user_id is null
);
-- User-specific policies for personal models
create policy "Users can manage their own AI models." on public.ai_models for all using (auth.uid() = user_id);

-- Policies for 'likes', 'comments', 'follows', 'story_casts'
create policy "Likes are public." on public.likes for select using (true);
create policy "Users can manage their own likes." on public.likes for all using (auth.uid() = user_id);

create policy "Comments are public." on public.comments for select using (true);
create policy "Users can manage their own comments." on public.comments for all using (auth.uid() = user_id);

create policy "Follow relationships are public." on public.follows for select using (true);
create policy "Users can manage their own follows." on public.follows for all using (auth.uid() = user_id);

create policy "Users can manage their own story casts." on public.story_casts for all using (auth.uid() = user_id);

-- Policies for 'articles' table
create policy "Published articles are viewable by everyone." on public.articles for select using (status = 'published');
create policy "Users can manage their own articles." on public.articles for all using (auth.uid() = user_id);


-- Create storage bucket for CharaForge images with public access
-- This has to be done via the Supabase Dashboard UI, but is noted here for completeness.
-- Bucket name: 'chara-images'
-- Public: Yes

-- Folder Policies (examples, apply in Supabase Dashboard -> Storage -> Policies)
-- Policy: "Allow users to manage their own avatar folders"
-- Target roles: authenticated
-- Allowed operations: SELECT, INSERT, UPDATE, DELETE
-- USING expression: bucket_id = 'chara-images' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]
-- WITH CHECK expression: bucket_id = 'chara-images' AND (storage.foldername(name))[1] = 'avatars' AND auth.uid()::text = (storage.foldername(name))[2]

-- Policy: "Allow users to manage their own character image folders"
-- Target roles: authenticated
-- Allowed operations: SELECT, INSERT, UPDATE, DELETE
-- USING expression: bucket_id = 'chara-images' AND (storage.foldername(name))[1] = 'usersImg' AND auth.uid()::text = (storage.foldername(name))[2]
-- WITH CHECK expression: bucket_id = 'chara-images' AND (storage.foldername(name))[1] = 'usersImg' AND auth.uid()::text = (storage.foldername(name))[2]
