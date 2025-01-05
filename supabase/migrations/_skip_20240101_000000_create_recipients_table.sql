-- Create recipients table
CREATE TABLE IF NOT EXISTS recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT
);

-- Enable RLS
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recipients"
ON recipients FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own recipients"
ON recipients FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own recipients"
ON recipients FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Create trigger for created_by
CREATE OR REPLACE FUNCTION set_recipient_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recipient_created_by_trigger
  BEFORE INSERT ON recipients
  FOR EACH ROW
  EXECUTE FUNCTION set_recipient_created_by();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION set_recipient_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recipient_updated_at_trigger
  BEFORE UPDATE ON recipients
  FOR EACH ROW
  EXECUTE FUNCTION set_recipient_updated_at();
