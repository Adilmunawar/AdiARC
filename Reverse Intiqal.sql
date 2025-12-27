DECLARE @TargetIntiqalID UNIQUEIDENTIFIER = '8aa451ae-b0e7-4d0c-963e-5a614deb659b';

BEGIN TRAN;

-- 1. Restore Previous Owners (Re-activate Sellers)
-- Logic: Find the people listed in 'PersonShare' for this mutation and re-activate their records in the specific Khewat.
UPDATE rhz.Ownership 
SET is_active = 1 
WHERE ownership_id IN (
    SELECT O.ownership_id
    FROM rhz.Ownership O
    INNER JOIN transactions.IntiqalLogicalPartition LP 
        ON O.khewat_id = LP.khewat_id
    INNER JOIN transactions.IntiqalPersonShare IPS 
        ON LP.intiqal_logicalpartition_id = IPS.intiqal_logicalpartition_id
    WHERE LP.intiqal_id = @TargetIntiqalID
      AND O.person_id = IPS.person_id -- Matches the Seller
      AND O.is_active = 0             -- Only target currently inactive records
);

-- 2. Remove New Ownerships (Buyers)
-- Logic: Delete any ownership record explicitly created by this mutation ID.
DELETE FROM rhz.Ownership 
WHERE intiqal_id = @TargetIntiqalID;

-- 3. Clear Approval Workflow (Reset the approval history)
DELETE FROM transactions.TransactionOperations 
WHERE transaction_id = @TargetIntiqalID;

-- 4. Reset Intiqal Status to Pending (Un-approve)
UPDATE transactions.Intiqal
SET 
    is_approved = 0,
    intiqal_status = 1,      -- Reset to Pending/Draft status
    intiqal_aprove_date = NULL,
    operation_id = NULL      -- Remove link to the operation center
WHERE intiqal_id = @TargetIntiqalID;

COMMIT TRAN;