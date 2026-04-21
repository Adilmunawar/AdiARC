OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
DECLARE @TargetUserID UNIQUEIDENTIFIER = 'c75e2e87-43b0-43c1-b373-84ad2e4619ee'
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;