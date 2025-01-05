-- Create disputes table
CREATE TABLE disputes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_disputes_parcel_id ON disputes(parcel_id);
CREATE INDEX idx_disputes_created_by ON disputes(created_by);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_priority ON disputes(priority);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own disputes"
  ON disputes FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own disputes"
  ON disputes FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
