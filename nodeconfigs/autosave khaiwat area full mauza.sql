BEGIN TRAN;

-- ⚠️ Target Mauza ID
DECLARE @MauzaID UNIQUEIDENTIFIER = '59096882-2361-4690-ab5f-6078bc48a10b'; 

-- 1. Calculate totals for all Khewats in the Mauza simultaneously
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
      AND Kh.is_active = 1 
      AND Kh.is_updated = 1
      AND Ks.is_active = 1 
      AND ISNULL(Ks.is_wrong, 0) = 0
    GROUP BY Kh.khewat_id
),
FormattedKhasra AS (
    SELECT 
        khewat_id,
        FLOOR(Total_SqFt / 5445) AS Kanals,
        Total_SqFt - (FLOOR(Total_SqFt / 5445) * 5445) AS Rem_For_Marlas
    FROM KhasraCalc
)
-- 2. Bulk apply the calculated areas and format IDs
UPDATE Kh
SET 
    Kh.total_area = 
        CAST(CAST(FK.Kanals AS INT) AS VARCHAR) + '-' + 
        CAST(CAST(FLOOR(FK.Rem_For_Marlas / 272.25) AS INT) AS VARCHAR) + '-' + 
        CAST(CAST(ROUND(FK.Rem_For_Marlas - (FLOOR(FK.Rem_For_Marlas / 272.25) * 272.25), 0) AS INT) AS VARCHAR),
        
    Kh.area_format = 2 
    
FROM rhz.Khewat Kh
INNER JOIN FormattedKhasra FK ON Kh.khewat_id = FK.khewat_id
WHERE Kh.mauza_id = @MauzaID
  AND Kh.is_active = 1
  AND Kh.is_updated = 1
  -- Only update those that are currently empty or zero
  AND (Kh.total_area IS NULL OR Kh.total_area IN ('', '0-0-0', '0-0'));

-- Check the count of Khewats fixed
SELECT @@ROWCOUNT AS Total_Khewats_Fixed_In_Mauza;
commit tran;
-- After checking the count above:
-- COMMIT TRAN;
-- ROLLBACK TRAN;