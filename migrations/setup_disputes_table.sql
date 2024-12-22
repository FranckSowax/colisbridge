-- Drop existing table if it exists
DROP TABLE IF EXISTS disputes;

-- Create disputes table
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    reason TEXT NOT NULL,
    description TEXT,
    resolution TEXT,
    resolution_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_disputes_parcel_id ON disputes(parcel_id);
CREATE INDEX idx_disputes_recipient_id ON disputes(recipient_id);
CREATE INDEX idx_disputes_created_by ON disputes(created_by);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Enable Row Level Security
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS select_disputes ON disputes;
CREATE POLICY select_disputes ON disputes
    FOR SELECT
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS insert_disputes ON disputes;
CREATE POLICY insert_disputes ON disputes
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS update_disputes ON disputes;
CREATE POLICY update_disputes ON disputes
    FOR UPDATE
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS delete_disputes ON disputes;
CREATE POLICY delete_disputes ON disputes
    FOR DELETE
    USING (auth.uid() = created_by);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to the table
COMMENT ON TABLE disputes IS 'Table des litiges liés aux colis';
