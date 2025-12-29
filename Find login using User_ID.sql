OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
DECLARE @TargetUserID UNIQUEIDENTIFIER = '31fedda6-1b49-43bc-866b-2222608ff5a0';
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;