DECLARE @targetintiqal UNIQUEIDENTIFIER = '98f46ae1-0062-4007-a31d-9716a75e1a5e'
begin tran;
update transactions.Intiqal
SET
intiqal_status = 6
where intiqal_id = @targetintiqal
commit tran

