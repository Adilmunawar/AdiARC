-- STEP 1: UNLOCK THE ENCRYPTION
OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

SELECT 
    4 AS [Khewat_No],
    
    -- Decrypt Khatuni Number
    REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.khatuni_no)) AS VARCHAR(50)), CHAR(0), '') AS [Khatuni_No],
    
    -- The User Info
    ISNULL(U.user_name, 'No User Linked') AS [Operator_Name],
    Kh.user_id AS [Raw_User_ID]

FROM rhz.Khewat K WITH (NOLOCK)
INNER JOIN rhz.Khatuni Kh WITH (NOLOCK) 
    ON K.khewat_id = Kh.khewat_id

LEFT JOIN dbo.Users U WITH (NOLOCK) 
    ON CAST(Kh.user_id AS VARCHAR(50)) = CAST(U.user_id AS VARCHAR(50))

WHERE 
    K.mauza_id = 'b3e68881-57e4-4c0e-9603-366d5443c470'
    AND K.is_active = 1   
    AND Kh.is_active = 1  
    AND TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) = 1

ORDER BY 
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.khatuni_no)) AS VARCHAR(50)), CHAR(0), '') AS INT);

CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;