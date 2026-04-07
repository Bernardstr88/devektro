-- Add insurance fields to installations
ALTER TABLE installations ADD COLUMN IF NOT EXISTS verzekering_maatschappij text DEFAULT '';
ALTER TABLE installations ADD COLUMN IF NOT EXISTS verzekering_vervaldatum date;

-- Dashboard settings table (admin-configurable)
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dashboard_settings" ON dashboard_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed default settings
INSERT INTO dashboard_settings (key, value) VALUES
  ('thresholds', '{"maintenance_days": 30, "keuring_days": 60, "insurance_days": 60, "generator_days": 30}'),
  ('widgets', '{"kpis": true, "expiring_maintenance": true, "expiring_keuring": true, "expiring_insurance": true, "generator_due": true, "upcoming_tasks": true, "data_warnings": true}'),
  ('widget_order', '["kpis", "expiring_maintenance", "expiring_keuring", "expiring_insurance", "generator_due", "upcoming_tasks", "data_warnings"]')
ON CONFLICT (key) DO NOTHING;