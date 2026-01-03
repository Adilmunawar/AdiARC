OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key'
DECLARE @TargetUserID UNIQUEIDENTIFIER = '6de90a64-5fbc-4044-857b-d830538702ae'
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;