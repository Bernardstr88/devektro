-- Seed the 3 default templates into the database
INSERT INTO installation_templates (name, type, power_kva, battery_kwh, default_labour_cost, default_estimated_sale_price) VALUES
  ('30kVA + 50kWh', 'mobile', 30, 50, 7500, 64000),
  ('15kVA + 40kWh', 'mobile', 15, 40, 6000, 52000),
  ('8kVA + 10kWh', 'mobile', 8, 10, 3750, 26000)
ON CONFLICT DO NOTHING;