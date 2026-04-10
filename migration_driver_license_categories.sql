-- Voeg rijbewijscategorieën toe aan de drivers tabel
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS license_categories text[] DEFAULT NULL;
