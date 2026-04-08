-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  license_expiry DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add driver_id column to vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Enable RLS on drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- RLS policies for drivers (same pattern as vehicles)
CREATE POLICY "Allow authenticated read access on drivers"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert access on drivers"
  ON public.drivers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access on drivers"
  ON public.drivers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access on drivers"
  ON public.drivers FOR DELETE
  TO authenticated
  USING (true);

-- Enable realtime for drivers
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_drivers_updated_at();
