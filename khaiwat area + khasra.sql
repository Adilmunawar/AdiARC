OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;
-- ⚠️ REPLACE with your specific Mauza ID
DECLARE @MauzaID UNIQUEIDENTIFIER = 'c01936bb-8c59-4f61-9c15-bedfbc7fa5d1'; 
WITH KhasraCalc AS (
    SELECT 
        Kh.khewat_id,
        -- Calculate Total Square Feet for each Khasra
        SUM(
            (COALESCE(TRY_CAST(PARSENAME(REPLACE(Ks.khasra_area, '-', '.'), 3) AS FLOAT), 0) * 5445) +  -- Kanal * 5445
            (COALESCE(TRY_CAST(PARSENAME(REPLACE(Ks.khasra_area, '-', '.'), 2) AS FLOAT), 0) * 272.25) + -- Marla * 272.25
            COALESCE(TRY_CAST(PARSENAME(REPLACE(Ks.khasra_area, '-', '.'), 1) AS FLOAT), 0) -- Feet
        ) AS Total_SqFt
    FROM rhz.Khewat Kh
    INNER JOIN rhz.Khatuni Kt ON Kh.khewat_id = Kt.khewat_id
    INNER JOIN rhz.Khasra Ks ON Kt.khatuni_id = Ks.khatuni_id
    WHERE Kh.mauza_id = @MauzaID 
      AND Ks.is_active = 1 
      -- 🟢 FIX: Handle NULL values in is_wrong
      AND ISNULL(Ks.is_wrong, 0) = 0
    GROUP BY Kh.khewat_id
),
FormattedKhasra AS (
    SELECT 
        khewat_id,
        Total_SqFt,
        -- Calculate Kanals: Total / 5445
        FLOOR(Total_SqFt / 5445) AS Kanals,
        -- Calculate Remaining SqFt for Marlas
        Total_SqFt - (FLOOR(Total_SqFt / 5445) * 5445) AS Rem_For_Marlas
    FROM KhasraCalc
)
SELECT 
    -- 1. Khewat Number (Decrypted)
    REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Kh.khewat_no) AS VARCHAR(100)), CHAR(0), '') AS [Khewat_Number],

    -- 2. Total Khewat Area
    ISNULL(CAST(Kh.total_area AS VARCHAR(50)), '0-0-0') AS [Total_Khewat_Area],

    -- 3. Total Khewat Share (Decrypted)
    ISNULL(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Kh.total_share) AS VARCHAR(100)), CHAR(0), ''), '0') AS [Total_Khewat_Share],

    -- 4. Total Khasra Area (Formatted K-M-F)
    CASE WHEN FK.Total_SqFt IS NULL THEN '0-0-0'
         ELSE 
            CAST(CAST(FK.Kanals AS INT) AS VARCHAR) + '-' + 
            CAST(CAST(FLOOR(FK.Rem_For_Marlas / 272.25) AS INT) AS VARCHAR) + '-' + 
            CAST(CAST(ROUND(FK.Rem_For_Marlas - (FLOOR(FK.Rem_For_Marlas / 272.25) * 272.25), 0) AS INT) AS VARCHAR)
    END AS [Total_Khasra_Area]

FROM rhz.Khewat Kh
LEFT JOIN FormattedKhasra FK ON Kh.khewat_id = FK.khewat_id
WHERE Kh.mauza_id = @MauzaID
  AND Kh.is_active = 1
  AND Kh.is_active = 1
ORDER BY [Khewat_Number];
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;