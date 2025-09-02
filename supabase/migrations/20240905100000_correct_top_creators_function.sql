-- Drop the old, problematic function if it exists
DROP FUNCTION IF EXISTS public.get_top_creators();

-- Create the new, more robust function
CREATE OR REPLACE FUNCTION public.get_top_creators()
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
        u.raw_user_meta_data->>'display_name' AS display_name,
        u.raw_user_meta_data->>'photo_url' AS photo_url,
        jsonb_build_object(
            'charactersCreated', COALESCE((u.raw_user_meta_data->'stats'->>'charactersCreated')::INT, 0),
            'followers', COALESCE((SELECT COUNT(*) FROM public.follows WHERE following_id = u.id), 0),
            'following', COALESCE((SELECT COUNT(*) FROM public.follows WHERE follower_id = u.id), 0),
            'totalLikes', COALESCE((SELECT COUNT(*) FROM public.likes l JOIN public.characters c ON l.character_id = c.id WHERE c.user_id = u.id), 0)
        ) AS stats
    FROM
        auth.users u
    WHERE
        u.raw_user_meta_data->>'display_name' IS NOT NULL
    ORDER BY
        COALESCE((u.raw_user_meta_data->'stats'->>'charactersCreated')::INT, 0) DESC
    LIMIT 4;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
