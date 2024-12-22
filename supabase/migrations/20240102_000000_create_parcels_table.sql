-- Create parcels table
CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    tracking_number TEXT UNIQUE,
    recipient_id UUID REFERENCES recipients(id),
    destination_country TEXT,
    shipping_type TEXT,
    weight DECIMAL,
    volume_cbm DECIMAL DEFAULT 0,
    cbm DECIMAL DEFAULT 0,
    shipping_date TIMESTAMPTZ,
    statut TEXT DEFAULT 'en_attente',
    status TEXT DEFAULT 'en_attente'
);

-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own parcels"
ON parcels FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own parcels"
ON parcels FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own parcels"
ON parcels FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Create trigger for created_by
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
