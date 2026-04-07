-- Update unit prices for SG-13 battery materials
-- 1. Victron Lithium smart batterij 25,6V - 200Ah: €1.397,50
UPDATE materials
SET unit_price = 1397.50
WHERE article_number = 'BAT524120620';

-- 2. Victron Multiplus II 48/10000/140-100: €1.334,49
UPDATE materials
SET unit_price = 1334.49
WHERE article_number = 'PMP483105000';

-- Also update the unit_price_at_time in installation_materials for SG-13
UPDATE installation_materials
SET unit_price_at_time = 1397.50
WHERE material_id = (SELECT id FROM materials WHERE article_number = 'BAT524120620')
  AND installation_id = (SELECT id FROM installations WHERE code = 'SG-13');

UPDATE installation_materials
SET unit_price_at_time = 1334.49
WHERE material_id = (SELECT id FROM materials WHERE article_number = 'PMP483105000')
  AND installation_id = (SELECT id FROM installations WHERE code = 'SG-13');

-- Verify quantities are correct (10 batteries, 3 multiplus)
UPDATE installation_materials
SET quantity = 10
WHERE material_id = (SELECT id FROM materials WHERE article_number = 'BAT524120620')
  AND installation_id = (SELECT id FROM installations WHERE code = 'SG-13');

UPDATE installation_materials
SET quantity = 3
WHERE material_id = (SELECT id FROM materials WHERE article_number = 'PMP483105000')
  AND installation_id = (SELECT id FROM installations WHERE code = 'SG-13');
