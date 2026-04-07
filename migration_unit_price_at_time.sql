-- Add unit_price_at_time to freeze BOM prices per installation
ALTER TABLE installation_materials ADD COLUMN unit_price_at_time numeric;

-- Backfill all existing records with current material price
UPDATE installation_materials im
SET unit_price_at_time = m.unit_price
FROM materials m
WHERE im.material_id = m.id;
