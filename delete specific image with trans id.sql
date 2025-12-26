DECLARE @TransactionId UNIQUEIDENTIFIER = '536de852-4e03-42a7-b584-a9417ddc3ad9';

BEGIN TRAN;

-- 1. Identify and Store Image IDs associated with the Transaction
SELECT image_id 
INTO #ImagesToDelete 
FROM transactions.TransactionImages 
WHERE transaction_id = @TransactionId;

-- 2. Delete from TransactionImages
DELETE FROM transactions.TransactionImages 
WHERE image_id IN (SELECT image_id FROM #ImagesToDelete);

-- 3. Delete from ScanImages
DELETE FROM transactions.ScanImages 
WHERE image_id IN (SELECT image_id FROM #ImagesToDelete);

-- 4. Clean up
DROP TABLE #ImagesToDelete;

COMMIT TRAN;