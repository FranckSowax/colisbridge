-- Create monthly_revenue table
CREATE TABLE IF NOT EXISTS monthly_revenue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    month_year VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add unique constraint on month_year
ALTER TABLE monthly_revenue ADD CONSTRAINT monthly_revenue_month_year_unique UNIQUE (month_year);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_revenue_updated_at
    BEFORE UPDATE ON monthly_revenue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
