-- Adds character_type for companion support
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS character_type text DEFAULT 'character';
