-- Drop table if re-running (caution: drops data)
DROP TABLE IF EXISTS dmi_drugs CASCADE;

-- 1. Drugs Catalogue Table
CREATE TABLE dmi_drugs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    category VARCHAR(100) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other')),
    strength VARCHAR(50) NOT NULL,
    unit_of_measurement VARCHAR(50) NOT NULL, -- e.g., mg, ml, grams, pcs
    minimum_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (minimum_stock_threshold >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate entries for exact same drug name, formulation, and strength
    CONSTRAINT unique_drug_formulation UNIQUE (name, dosage_form, strength)
);

-- Indexes for lightning-fast search, filtering, and pagination
CREATE INDEX idx_dmi_drugs_name ON dmi_drugs(name);
CREATE INDEX idx_dmi_drugs_generic_name ON dmi_drugs(generic_name);
CREATE INDEX idx_dmi_drugs_category ON dmi_drugs(category);
CREATE INDEX idx_dmi_drugs_status ON dmi_drugs(is_active);