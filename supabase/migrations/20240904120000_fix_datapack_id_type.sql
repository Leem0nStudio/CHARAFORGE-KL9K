
-- 1. Alter the 'characters' table to drop the foreign key constraint on 'datapacks'
ALTER TABLE public.characters
DROP CONSTRAINT IF EXISTS characters_data_pack_id_fkey;

-- 2. Alter the 'datapacks' table to change the 'id' column type from UUID to TEXT
ALTER TABLE public.datapacks
ALTER COLUMN id SET DATA TYPE TEXT;

-- 3. Re-add the foreign key constraint to the 'characters' table, referencing the updated 'datapacks' table
-- It's important that this matches the definition in the initial schema for consistency.
-- We are just re-establishing the link after the type change.
ALTER TABLE public.characters
ADD CONSTRAINT characters_data_pack_id_fkey
FOREIGN KEY (data_pack_id)
REFERENCES public.datapacks(id)
ON DELETE SET NULL;
