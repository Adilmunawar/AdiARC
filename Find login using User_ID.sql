OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
DECLARE @TargetUserID UNIQUEIDENTIFIER = '248b781b-7019-46da-b916-9c0a8246afea';
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;