-- Seed 18 vehicles from Status+voertuigtellers.xlsx
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

INSERT INTO vehicles (license_plate, brand, model, category, mileage, active)
VALUES
  ('1ESD319', 'Onbekend', 'Bestelwagen 1',  'bestelwagen', 112965.10, true),
  ('1SNK946', 'Onbekend', 'Bestelwagen 2',  'bestelwagen', 111404.30, true),
  ('1SXU733', 'Onbekend', 'Bestelwagen 3',  'bestelwagen',  73978.20, true),
  ('1UAT287', 'Onbekend', 'Bestelwagen 4',  'bestelwagen',  84916.70, true),
  ('1VJS796', 'Onbekend', 'Bestelwagen 5',  'bestelwagen',  94915.21, true),
  ('1WHY579', 'Onbekend', 'Bestelwagen 6',  'bestelwagen',  58834.21, true),
  ('1XAJ078', 'Onbekend', 'Bestelwagen 7',  'bestelwagen',  54208.20, true),
  ('1XAX264', 'Onbekend', 'Bestelwagen 8',  'bestelwagen',  84400.30, true),
  ('1YAM541', 'Onbekend', 'Bestelwagen 9',  'bestelwagen', 165165.70, true),
  ('1YWW725', 'Onbekend', 'Bestelwagen 10', 'bestelwagen',  19387.50, true),
  ('1YWW767', 'Onbekend', 'Bestelwagen 11', 'bestelwagen',  34884.70, true),
  ('2ANT656', 'Onbekend', 'Bestelwagen 12', 'bestelwagen',  82604.41, true),
  ('2BSD875', 'Onbekend', 'Bestelwagen 13', 'bestelwagen',  37572.31, true),
  ('2BSD890', 'Onbekend', 'Bestelwagen 14', 'bestelwagen',  29888.71, true),
  ('2CAT548', 'Onbekend', 'Bestelwagen 15', 'bestelwagen',  26497.40, true),
  ('2DQZ936', 'Onbekend', 'Bestelwagen 16', 'bestelwagen',  22700.71, true),
  ('2FQE183', 'Onbekend', 'Bestelwagen 17', 'bestelwagen',  14331.40, true),
  ('2HRY791', 'Onbekend', 'Bestelwagen 18', 'bestelwagen', 137469.80, true);
