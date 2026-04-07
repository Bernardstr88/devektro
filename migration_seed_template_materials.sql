-- Seed template_materials based on SG-17's BOM
-- Run AFTER migration_seed_templates.sql and after SG-17 has its materials

DO $$
DECLARE
  v_template_id uuid;
  v_installation_id uuid;
BEGIN
  -- Find the 30kVA + 50kWh template
  SELECT id INTO v_template_id
  FROM installation_templates
  WHERE name = '30kVA + 50kWh'
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Template "30kVA + 50kWh" not found. Run migration_seed_templates.sql first.';
  END IF;

  -- Find SG-17
  SELECT id INTO v_installation_id
  FROM installations
  WHERE code = 'SG-17'
  LIMIT 1;

  IF v_installation_id IS NULL THEN
    RAISE EXCEPTION 'Installation "SG-17" not found.';
  END IF;

  -- Copy all SG-17 materials into template_materials (skip duplicates)
  INSERT INTO template_materials (template_id, material_id, quantity)
  SELECT v_template_id, im.material_id, im.quantity
  FROM installation_materials im
  WHERE im.installation_id = v_installation_id
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Copied % materials from SG-17 to template "30kVA + 50kWh"',
    (SELECT count(*) FROM installation_materials WHERE installation_id = v_installation_id);
END $$;
