DECLARE @MauzaID UNIQUEIDENTIFIER = 'e7d173f8-1b46-4325-b8d3-6c9f2265703c'; -- Replace with your Target Mauza ID

BEGIN TRAN;
UPDATE transactions.Intiqal
SET is_approved = 0
WHERE mauza_id = @MauzaID
 AND INTIQAL_STATUS = 1
  AND is_approved= 1;

COMMIT TRAN;