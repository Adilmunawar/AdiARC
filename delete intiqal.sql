declare @TargetIntiqal UNIQUEIDENTIFIER = 'ec030a6f-d638-4d24-89f2-13fceb6a5fa5';
BEGIN TRAN

DELETE FROM transactions.Intiqal
WHERE 
    intiqal_id = @TargetIntiqal
COMMIT TRAN;