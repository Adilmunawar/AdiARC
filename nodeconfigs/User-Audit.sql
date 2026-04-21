-- STEP 1: UNLOCK THE ENCRYPTION
OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

-- STEP 2: SET YOUR TARGET USER (Add Mauza ID if you want to limit the search scope)
DECLARE @TargetUserID VARCHAR(50) = 'A8BA21AB-3720-41F3-BD17-6FE80DE53530';
DECLARE @MauzaID UNIQUEIDENTIFIER = '4b252336-47d6-48df-b2ad-c4c3e1e33563'; 

-- ====================================================================
-- GRID 1: OWNERSHIP (MALIK)
-- ====================================================================
SELECT 
    'Ownership (Malik)' AS [Category],
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khewat_No],
    
    -- Combine First and Last Name cleanly into one column
    LTRIM(RTRIM(
        ISNULL(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), P.first_name)) AS NVARCHAR(250)), '') + ' ' + 
        ISNULL(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), P.last_name)) AS NVARCHAR(250)), '')
    )) AS [Complete_Person_Name],
    
    CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), O.person_share)) AS VARCHAR(100)) AS [Person_Share],
    CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), O.person_area)) AS VARCHAR(100)) AS [Person_Area],
    O.access_datetime AS [Entry_Time]

FROM rhz.Ownership O WITH (NOLOCK)
INNER JOIN rhz.Khewat K WITH (NOLOCK) ON O.khewat_id = K.khewat_id
LEFT JOIN reference.Person P WITH (NOLOCK) ON O.person_id = P.person_id

WHERE CAST(O.user_id AS VARCHAR(50)) = @TargetUserID
  AND K.mauza_id = @MauzaID;

-- ====================================================================
-- GRID 2: KASHTKAR (POSSESSION)
-- ====================================================================
SELECT 
    'Kashtkar (Possession)' AS [Category],
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khewat_No],
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.khatuni_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khatuni_No],
    
    -- Combine First and Last Name cleanly into one column
    LTRIM(RTRIM(
        ISNULL(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), P.first_name)) AS NVARCHAR(250)), '') + ' ' + 
        ISNULL(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), P.last_name)) AS NVARCHAR(250)), '')
    )) AS [Complete_Person_Name],
    
    CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Pos.person_share)) AS VARCHAR(100)) AS [Person_Share],
    CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Pos.person_area)) AS VARCHAR(100)) AS [Person_Area],
    Pos.access_datetime AS [Entry_Time]

FROM rhz.Possession Pos WITH (NOLOCK)
INNER JOIN rhz.Khatuni Kh WITH (NOLOCK) ON Pos.khatuni_id = Kh.khatuni_id
INNER JOIN rhz.Khewat K WITH (NOLOCK) ON Kh.khewat_id = K.khewat_id
LEFT JOIN reference.Person P WITH (NOLOCK) ON Pos.person_id = P.person_id

WHERE CAST(Pos.user_id AS VARCHAR(50)) = @TargetUserID
  AND K.mauza_id = @MauzaID;

-- ====================================================================
-- GRID 3: KHATUNI DETAILS
-- ====================================================================
SELECT 
    'Khatuni Detail' AS [Category],
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khewat_No],
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.khatuni_no)) AS VARCHAR(50)), CHAR(0), '') AS INT) AS [Khatuni_No],
    
    -- Pulls the actual text name of the Khatuni Type (e.g., "حصہ داران")
    KT.khatuni_type_name AS [Khatuni_Type],
    
    CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.total_share)) AS VARCHAR(100)) AS [Total_Share],
    CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), Kh.total_area)) AS VARCHAR(100)) AS [Total_Area],
    Kh.access_datetime AS [Entry_Time]

FROM rhz.Khatuni Kh WITH (NOLOCK)
INNER JOIN rhz.Khewat K WITH (NOLOCK) ON Kh.khewat_id = K.khewat_id
LEFT JOIN Setup.KhatuniType KT WITH (NOLOCK) ON Kh.khatuni_type_id = KT.khatuni_type_id

WHERE CAST(Kh.user_id AS VARCHAR(50)) = @TargetUserID
  AND K.mauza_id = @MauzaID;

-- STEP 3: LOCK IT UP
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;