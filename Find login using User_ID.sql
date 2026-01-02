OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
DECLARE @TargetUserID UNIQUEIDENTIFIER = '4643f1ea-d275-4b64-b6d3-d4f46a05ef41';
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;