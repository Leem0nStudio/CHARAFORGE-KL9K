
-- Drop the existing function if it's incorrect to ensure a clean state
DROP FUNCTION IF EXISTS public.get_top_creators();

-- Re-create the function with the correct logic
CREATE OR REPLACE FUNCTION public.get_top_creators()
RETURNS TABLE(id uuid, display_name text, photo_url text, stats jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.raw_user_meta_data->>'display_name' as display_name,
        u.raw_user_meta_data->>'photo_url' as photo_url,
        COALESCE(u.raw_user_meta_data->'stats', '{}'::jsonb) as stats
    FROM
        auth.users u
    WHERE
        (u.raw_user_meta_data->'stats'->>'charactersCreated') IS NOT NULL
    ORDER BY
        (u.raw_user_meta_data->'stats'->>'charactersCreated')::int DESC
    LIMIT 4;
END;
$$;
