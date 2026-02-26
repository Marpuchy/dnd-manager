-- Añadir campo possible_encounters a la tabla campaign_map_zones
-- Este campo almacenará un array de IDs de criaturas del bestiario que pueden aparecer en la zona

-- Añadir la columna possible_encounters como tipo JSON (array de strings)
ALTER TABLE campaign_map_zones 
ADD COLUMN possible_encounters JSONB DEFAULT '[]'::jsonb;

-- Crear índice para mejorar el rendimiento de consultas sobre posibles apariciones
CREATE INDEX idx_campaign_map_zones_possible_encounters 
ON campaign_map_zones USING GIN (possible_encounters);

-- Comentario sobre la nueva columna
COMMENT ON COLUMN campaign_map_zones.possible_encounters IS 'Array de IDs de criaturas del bestiario que pueden aparecer en esta zona';
