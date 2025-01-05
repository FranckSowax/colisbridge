-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  standard_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  express_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO settings (standard_price_per_kg, express_price_per_kg)
SELECT 10.00, 15.00
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
