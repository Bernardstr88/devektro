-- Fix SG-03 BOM: add missing items and correct kabelgoot quantity
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_inst_id uuid;
  v_mat_id uuid;
BEGIN
  -- Get SG-03 installation id
  SELECT id INTO v_inst_id FROM installations WHERE code = 'SG-03' LIMIT 1;
  IF v_inst_id IS NULL THEN
    RAISE EXCEPTION 'Installation SG-03 not found';
  END IF;

  -- 1) Add 2× akoestische roosters (Storax)
  SELECT id INTO v_mat_id FROM materials WHERE name ILIKE '%akoestisch%rooster%' LIMIT 1;
  IF v_mat_id IS NOT NULL THEN
    INSERT INTO installation_materials (installation_id, material_id, quantity)
    VALUES (v_inst_id, v_mat_id, 2)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Added 2x akoestische roosters to SG-03';
  ELSE
    RAISE WARNING 'Material "akoestische roosters" not found in materials table';
  END IF;

  -- 2) Add 1× muurrooster (Renson)
  SELECT id INTO v_mat_id FROM materials WHERE name ILIKE '%muurrooster%' LIMIT 1;
  IF v_mat_id IS NOT NULL THEN
    INSERT INTO installation_materials (installation_id, material_id, quantity)
    VALUES (v_inst_id, v_mat_id, 1)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Added 1x muurrooster to SG-03';
  ELSE
    RAISE WARNING 'Material "muurrooster" not found in materials table';
  END IF;

  -- 3) Add 1× isolatiebewaking (Bender)
  SELECT id INTO v_mat_id FROM materials WHERE name ILIKE '%isolatiebewaking%' LIMIT 1;
  IF v_mat_id IS NOT NULL THEN
    INSERT INTO installation_materials (installation_id, material_id, quantity)
    VALUES (v_inst_id, v_mat_id, 1)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Added 1x isolatiebewaking to SG-03';
  ELSE
    RAISE WARNING 'Material "isolatiebewaking" not found in materials table';
  END IF;

  -- 4) Add PIR isolatieplaat
  SELECT id INTO v_mat_id FROM materials WHERE name ILIKE '%PIR%isolatie%' LIMIT 1;
  IF v_mat_id IS NOT NULL THEN
    INSERT INTO installation_materials (installation_id, material_id, quantity)
    VALUES (v_inst_id, v_mat_id, 1)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Added 1x PIR isolatieplaat to SG-03';
  ELSE
    RAISE WARNING 'Material "PIR isolatieplaat" not found in materials table';
  END IF;

  -- 5) Update kabelgoot 100x130 quantity from 6.5 to 7
  SELECT id INTO v_mat_id FROM materials WHERE name ILIKE '%kabelgoot%100%130%' LIMIT 1;
  IF v_mat_id IS NOT NULL THEN
    UPDATE installation_materials 
    SET quantity = 6.5 
    WHERE installation_id = v_inst_id AND material_id = v_mat_id;
    RAISE NOTICE 'Updated kabelgoot 100x130 quantity to 6.5';
  END IF;

  RAISE NOTICE 'SG-03 BOM fix complete';
END $$;
