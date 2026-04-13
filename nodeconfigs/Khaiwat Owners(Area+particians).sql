OPEN MASTER KEY DECRYPTION BY PASSWORD = 'masterkey';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

DECLARE @MauzaID UNIQUEIDENTIFIER = 'bc04ae8e-c3c5-4b33-8e88-8b61fde5f44f';
DECLARE @TargetKhewat VARCHAR(50) = '2584';

SELECT 
    -- 1. Khewat Number
    COALESCE(
        NULLIF(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Kh.khewat_no) AS VARCHAR(100)), CHAR(0), ''), ''),
        CAST(Kh.khewat_no AS VARCHAR(100))
    ) AS [Khewat_Number],

    -- 2. Owner Name (First Name + Last Name Decrypted)
    LTRIM(RTRIM(
        COALESCE(NULLIF(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, P.first_name) AS NVARCHAR(1000)), CHAR(0), ''), ''), CAST(P.first_name AS NVARCHAR(1000)), '') 
        + ' ' + 
        COALESCE(NULLIF(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, P.last_name) AS NVARCHAR(1000)), CHAR(0), ''), ''), CAST(P.last_name AS NVARCHAR(1000)), '')
    )) AS [Owner_Name],

    -- 3. Father/Husband Name (Stored as plain text in schema)
    P.person_fname AS [Father_Husband_Name],

    -- 4. Person Share (Decrypted)
    COALESCE(
        NULLIF(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Ow.person_share) AS VARCHAR(100)), CHAR(0), ''), ''),
        CAST(Ow.person_share AS VARCHAR(100))
    ) AS [Share_Partition],

    -- 5. Person Area
    Ow.person_area AS [Area_Allocated]

FROM rhz.Khewat Kh
INNER JOIN rhz.Ownership Ow ON Kh.khewat_id = Ow.khewat_id
INNER JOIN reference.Person P ON Ow.person_id = P.person_id

WHERE Kh.mauza_id = @MauzaID
  AND ISNULL(Kh.is_active, 1) = 1
  AND ISNULL(Ow.is_active, 1) = 1
  -- Match against the decrypted Khewat Number dynamically
  AND COALESCE(
        NULLIF(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Kh.khewat_no) AS VARCHAR(100)), CHAR(0), ''), ''),
        CAST(Kh.khewat_no AS VARCHAR(100))
    ) = @TargetKhewat

ORDER BY [Owner_Name];

CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;