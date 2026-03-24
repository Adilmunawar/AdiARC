DECLARE @TransactionId UNIQUEIDENTIFIER = '6b9cc057-a786-4745-9592-781e12896a17';

BEGIN TRAN;

-- Create a temporary list of image IDs to ensure both tables are cleaned correctly
SELECT image_id 
INTO #ImagesToDelete 
FROM transactions.TransactionImages 
WHERE transaction_id = @TransactionId;

-- Delete metadata from the TransactionImages table
DELETE FROM transactions.TransactionImages 
WHERE image_id IN (SELECT image_id FROM #ImagesToDelete);

-- Delete the actual binary files from the ScanImages table
DELETE FROM transactions.ScanImages 
WHERE image_id IN (SELECT image_id FROM #ImagesToDelete);

-- Clean up the temporary table
DROP TABLE #ImagesToDelete;

COMMIT TRAN;