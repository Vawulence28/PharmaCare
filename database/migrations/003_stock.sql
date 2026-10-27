-- Drop tables if re-running (caution: drops data)
DROP TABLE IF EXISTS dmi_stock_transactions CASCADE;
DROP TABLE IF EXISTS dmi_batches CASCADE;

-- 1. Batches Table
CREATE TABLE dmi_batches (
    id SERIAL PRIMARY KEY,
    drug_id INTEGER NOT NULL REFERENCES dmi_drugs(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    quantity_received INTEGER NOT NULL CHECK (quantity_received >= 0),
    current_quantity INTEGER NOT NULL CHECK (current_quantity >= 0),
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00 CHECK (unit_cost >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate batch numbers for the same drug
    CONSTRAINT unique_drug_batch UNIQUE (drug_id, batch_number)
);

-- 2. Stock Transactions Table (Audit Trail)
CREATE TABLE dmi_stock_transactions (
    id SERIAL PRIMARY KEY,
    drug_id INTEGER NOT NULL REFERENCES dmi_drugs(id) ON DELETE RESTRICT,
    batch_id INTEGER NOT NULL REFERENCES dmi_batches(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('RECEIVED', 'ISSUED', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL CHECK (quantity <> 0), -- Positive for IN (RECEIVED/ADJUSTMENT+), Negative for OUT (ISSUED/ADJUSTMENT-)
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES dmi_users(id) ON DELETE RESTRICT,
    reason_or_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance, FEFO queries, expiry alerts, and reporting
CREATE INDEX idx_dmi_batches_drug_id ON dmi_batches(drug_id);
CREATE INDEX idx_dmi_batches_expiry_date ON dmi_batches(expiry_date);
CREATE INDEX idx_dmi_batches_current_quantity ON dmi_batches(current_quantity);
CREATE INDEX idx_dmi_stock_transactions_drug_id ON dmi_stock_transactions(drug_id);
CREATE INDEX idx_dmi_stock_transactions_batch_id ON dmi_stock_transactions(batch_id);
CREATE INDEX idx_dmi_stock_transactions_date ON dmi_stock_transactions(transaction_date);