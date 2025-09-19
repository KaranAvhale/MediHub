-- Database Migration Script for MediHub
-- This script adds the missing hospital_id and hospital_name columns to the child_aadhaar table
-- Run this script in your Supabase SQL Editor

-- Step 1: Add hospital_id column to child_aadhaar table
ALTER TABLE child_aadhaar 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id);

-- Step 2: Add hospital_name column to child_aadhaar table
ALTER TABLE child_aadhaar 
ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_child_aadhaar_hospital_id 
ON child_aadhaar(hospital_id);

CREATE INDEX IF NOT EXISTS idx_child_aadhaar_hospital_name 
ON child_aadhaar(hospital_name);

-- Step 4: If you have existing hospital data, update the records
-- This is a best-effort update for existing records
-- Uncomment and modify these queries based on your hospital data structure

/*
-- Example: Update hospital_name and hospital_id if you have a hospitals table
UPDATE child_aadhaar 
SET 
    hospital_id = h.id,
    hospital_name = h.hospital_name
FROM hospitals h
WHERE child_aadhaar.hospital_id IS NULL
AND h.hospital_name = 'Your Hospital Name'; -- Replace with actual hospital name
*/

-- Step 5: Add comments to the columns for documentation
COMMENT ON COLUMN child_aadhaar.hospital_id IS 'Foreign key reference to the hospital where the child ID was created';
COMMENT ON COLUMN child_aadhaar.hospital_name IS 'Name of the hospital where the child ID was created';

-- Verification queries (optional - run these to check the migration)
-- SELECT COUNT(*) as total_records FROM child_aadhaar;
-- SELECT COUNT(*) as records_with_hospital_id FROM child_aadhaar WHERE hospital_id IS NOT NULL;
-- SELECT hospital_name, COUNT(*) as count FROM child_aadhaar GROUP BY hospital_name;
