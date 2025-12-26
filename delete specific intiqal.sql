-- 1. Declare the Target Variables
DECLARE @MauzaID UNIQUEIDENTIFIER = '5edb831e-b3c5-4682-8238-0baf160920f5'; -- Replace with your Mauza ID
DECLARE @TargetIntiqalID UNIQUEIDENTIFIER = '7b24a39b-3459-4453-b3a5-a4323a5048d7'; -- Replace with your Intiqal ID

BEGIN TRAN; -- Start Transaction (Safety)

-- 2. Delete from Child Tables (Dependencies)

-- Delete Reports
DELETE FROM transactions.IntiqalReport  
WHERE intiqal_id = @TargetIntiqalID;

-- Delete Khasra Details (linked via Logical Partition)
DELETE FROM transactions.IntiqalKhasra  
WHERE intiqal_logicalpartition_id IN (
    SELECT intiqal_logicalpartition_id  
    FROM transactions.IntiqalLogicalPartition  
    WHERE intiqal_id = @TargetIntiqalID
);

-- Delete Person Shares (linked via Logical Partition)
DELETE FROM transactions.IntiqalPersonShare  
WHERE intiqal_logicalpartition_id IN (
    SELECT intiqal_logicalpartition_id  
    FROM transactions.IntiqalLogicalPartition  
    WHERE intiqal_id = @TargetIntiqalID
);

-- Delete Logical Partitions
DELETE FROM transactions.IntiqalLogicalPartition  
WHERE intiqal_id = @TargetIntiqalID;

-- Delete Court Orders
DELETE FROM transactions.IntiqalCourtOrder  
WHERE intiqal_id = @TargetIntiqalID;

-- Delete Charges
DELETE FROM transactions.IntiqalCharges  
WHERE intiqal_id = @TargetIntiqalID;

-- Delete Registry Info
DELETE FROM transactions.IntiqalRegistery  
WHERE intiqal_id = @TargetIntiqalID;

-- Delete Bank Orders
DELETE FROM transactions.IntiqalBankOrder  
WHERE Intiqal_id = @TargetIntiqalID;

-- Delete Challan Forms
DELETE FROM transactions.ChallanForm  
WHERE Intiqal_id = @TargetIntiqalID;

-- 3. Delete the Main Intiqal Record
DELETE FROM transactions.Intiqal  
WHERE intiqal_id = @TargetIntiqalID 
  AND mauza_id = @MauzaID;

COMMIT TRAN; -- Commit the changes
-- ROLLBACK TRAN; -- Run this instead of COMMIT if you want to undo during testing