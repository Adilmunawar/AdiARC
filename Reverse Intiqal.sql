DECLARE @TargetIntiqalID UNIQUEIDENTIFIER = '8aa451ae-b0e7-4d0c-963e-5a614deb659b';
BEGIN TRAN;
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
      AND O.person_id = IPS.person_id 
      AND O.is_active = 0
);
DELETE FROM rhz.Ownership 
WHERE intiqal_id = @TargetIntiqalID;
DELETE FROM transactions.TransactionOperations 
WHERE transaction_id = @TargetIntiqalID;
UPDATE transactions.Intiqal
SET 
    is_approved = 0,
    intiqal_status = 1,
    intiqal_aprove_date = NULL,
    operation_id = NULL
WHERE intiqal_id = @TargetIntiqalID;

COMMIT TRAN;