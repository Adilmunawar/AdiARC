-- STEP 1: UNLOCK THE ENCRYPTION
OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

-- STEP 2: SET YOUR TARGET MAUZA
DECLARE @MauzaID UNIQUEIDENTIFIER = 'b3e68881-57e4-4c0e-9603-366d5443c470';

-- STEP 3: RUN THE MAUZA-WIDE REPORT
SELECT 
    -- Decrypt Khewat Number
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khewat_No],
    
    -- Decrypt Khatuni Number
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.khatuni_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khatuni_No],
    
    -- Pull the true operator name from the master view
    ISNULL(U.user_name, 'System Generated / Unlinked') AS [Operator_Name],
    
    Kh.user_id AS [Raw_User_ID]

FROM rhz.Khewat K WITH (NOLOCK)
INNER JOIN rhz.Khatuni Kh WITH (NOLOCK) 
    ON K.khewat_id = Kh.khewat_id

-- 🟢 THE FIX: Join using the application's dedicated master view
LEFT JOIN users.vw_user U WITH (NOLOCK) 
    ON CAST(Kh.user_id AS VARCHAR(50)) = CAST(U.user_id AS VARCHAR(50))

WHERE 
    K.mauza_id = @MauzaID
    AND K.is_active = 1   
    AND Kh.is_active = 1  

-- Sort logically by Khewat, then by Khatoni within that Khewat
ORDER BY 
    [Khewat_No],
    [Khatuni_No];

-- STEP 4: LOCK IT UP
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;