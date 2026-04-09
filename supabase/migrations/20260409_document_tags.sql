ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
