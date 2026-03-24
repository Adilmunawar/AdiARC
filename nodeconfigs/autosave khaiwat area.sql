OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

BEGIN TRAN;

-- ⚠️ Exact Target Definition
DECLARE @MauzaID UNIQUEIDENTIFIER = '59096882-2361-4690-ab5f-6078bc48a10b'; 
DECLARE @TargetKhewat VARCHAR(100) = '1015'; 

-- 1. Safely calculate the area for ONLY this specific Khewat
WITH KhasraCalc AS (
    SELECT 
        Kh.khewat_id,
        SUM(
            (COALESCE(TRY_CAST(PARSENAME(REPLACE(Ks.khasra_area, '-', '.'), 3) AS FLOAT), 0) * 5445) +  
            (COALESCE(TRY_CAST(PARSENAME(REPLACE(Ks.khasra_area, '-', '.'), 2) AS FLOAT), 0) * 272.25) + 
            COALESCE(TRY_CAST(PARSENAME(REPLACE(Ks.khasra_area, '-', '.'), 1) AS FLOAT), 0) 
        ) AS Total_SqFt
    FROM rhz.Khewat Kh
    INNER JOIN rhz.Khatuni Kt ON Kh.khewat_id = Kt.khewat_id
    INNER JOIN rhz.Khasra Ks ON Kt.khatuni_id = Ks.khatuni_id
    WHERE Kh.mauza_id = @MauzaID 
      -- Strict target conditions
      AND Kh.is_active = 1 
      AND Kh.is_updated = 1
      AND Ks.is_active = 1 
      AND ISNULL(Ks.is_wrong, 0) = 0
      AND REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Kh.khewat_no) AS VARCHAR(100)), CHAR(0), '') = @TargetKhewat
    GROUP BY Kh.khewat_id
),
FormattedKhasra AS (
    SELECT 
        khewat_id,
        FLOOR(Total_SqFt / 5445) AS Kanals,
        Total_SqFt - (FLOOR(Total_SqFt / 5445) * 5445) AS Rem_For_Marlas
    FROM KhasraCalc
)

-- 2. Strictly update ONLY the matching row
UPDATE Kh
SET 
    Kh.total_area = 
        CAST(CAST(FK.Kanals AS INT) AS VARCHAR) + '-' + 
        CAST(CAST(FLOOR(FK.Rem_For_Marlas / 272.25) AS INT) AS VARCHAR) + '-' + 
        CAST(CAST(ROUND(FK.Rem_For_Marlas - (FLOOR(FK.Rem_For_Marlas / 272.25) * 272.25), 0) AS INT) AS VARCHAR),
        
    -- Apply format ID 2
    Kh.area_format = 2 
    
FROM rhz.Khewat Kh
INNER JOIN FormattedKhasra FK ON Kh.khewat_id = FK.khewat_id
WHERE Kh.mauza_id = @MauzaID
  -- Double verification in the update block
  AND Kh.is_active = 1
  AND Kh.is_updated = 1
  AND REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, Kh.khewat_no) AS VARCHAR(100)), CHAR(0), '') = @TargetKhewat;

-- 3. Verify safety. This MUST output exactly '1'
SELECT @@ROWCOUNT AS Rows_Affected_Must_Be_One;

-- If it says 1, run this:
-- COMMIT TRAN;

-- If it says 0 or >1, run this:
-- ROLLBACK TRAN;
COMMIT TRAN;
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;