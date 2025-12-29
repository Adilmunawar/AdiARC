DECLARE @TransactionId UNIQUEIDENTIFIER = '536de852-4e03-42a7-b584-a9417ddc3ad9';
BEGIN TRAN;
SELECT image_id 
INTO #ImagesToDelete 
FROM transactions.TransactionImages 
WHERE transaction_id = @TransactionId;
DELETE FROM transactions.TransactionImages 
WHERE image_id IN (SELECT image_id FROM #ImagesToDelete);
DELETE FROM transactions.ScanImages 
WHERE image_id IN (SELECT image_id FROM #ImagesToDelete);
DROP TABLE #ImagesToDelete;
COMMIT TRAN;