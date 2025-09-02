-- This migration corrects the data type of the 'id' column in the 'datapacks' table.
-- It was incorrectly set to UUID in the initial schema, but it needs to be TEXT
-- to accommodate human-readable IDs like "fantasy-basics".

-- 1. Change the column type from UUID to TEXT.
-- We use 'USING id::text' to cast the existing UUIDs to text format if any exist.
ALTER TABLE public.datapacks
ALTER COLUMN id TYPE TEXT USING id::text;

-- Note: The foreign key constraint from 'characters' to 'datapacks' was removed
-- from the initial schema because it referenced a non-existent column. 
-- Data integrity between characters and datapacks will be handled at the application layer.
