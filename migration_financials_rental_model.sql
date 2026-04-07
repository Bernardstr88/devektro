-- Migrate financials table from sale model to rental model
-- Run in Supabase SQL Editor

-- Remove old sale price column
ALTER TABLE financials DROP COLUMN IF EXISTS estimated_sale_price;

-- Add rental model columns
ALTER TABLE financials ADD COLUMN IF NOT EXISTS depreciation_years integer NOT NULL DEFAULT 5;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS annual_rental_income numeric NOT NULL DEFAULT 0;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS residual_value numeric NOT NULL DEFAULT 0;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS cash_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS loan_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS loan_interest_rate numeric NOT NULL DEFAULT 0;
ALTER TABLE financials ADD COLUMN IF NOT EXISTS loan_term_years integer NOT NULL DEFAULT 5;
