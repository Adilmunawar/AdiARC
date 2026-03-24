OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key'
DECLARE @TargetUserID UNIQUEIDENTIFIER = 'fc6697a4-a80c-48c4-9037-f07315550685'
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;