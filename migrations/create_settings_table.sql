-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tarifs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default settings
INSERT INTO settings (tarifs) VALUES ('{
    "GA": {
        "standard": 5000,
        "express": 7500,
        "cbm": 150000
    },
    "CI": {
        "standard": 4500,
        "express": 7000,
        "cbm": 140000
    },
    "TG": {
        "standard": 4800,
        "express": 7200,
        "cbm": 145000
    },
    "FR": {
        "standard": 6000,
        "express": 8500,
        "cbm": 160000
    }
}'::jsonb);
