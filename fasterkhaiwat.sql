OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

-- STEP 1: BULK DECRYPTION (Filtered by Active & Updated)
IF OBJECT_ID('tempdb..#KhewatStage') IS NOT NULL DROP TABLE #KhewatStage;

CREATE TABLE #KhewatStage (
    mauza_id UNIQUEIDENTIFIER,
    Khewat_No INT
);

INSERT INTO #KhewatStage WITH (TABLOCK)
SELECT 
    K.mauza_id,
    TRY_CAST(
        REPLACE(
            CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(50)), 
            CHAR(0), ''
        ) 
    AS INT)
FROM rhz.Khewat K WITH (NOLOCK)
WHERE K.khewat_no IS NOT NULL
  AND K.is_active = 1    -- Condition 1: Must be Active
  AND K.is_updated = 1   -- Condition 2: Must be Updated (Amal Daramad)
OPTION (MAXDOP 0); 

-- STEP 2: INSTANT INDEXING
CREATE CLUSTERED INDEX IX_Stage_Mauza_Khewat ON #KhewatStage(mauza_id, Khewat_No) WITH (FILLFACTOR = 100);

-- STEP 3: CALCULATE RANGES (Gaps)
WITH OrderedKhewats AS (
    SELECT 
        mauza_id,
        Khewat_No,
        LEAD(Khewat_No) OVER (PARTITION BY mauza_id ORDER BY Khewat_No) AS Next_Khewat
    FROM #KhewatStage
),
Gaps AS (
    SELECT 
        mauza_id,
        (Khewat_No + 1) AS Missing_Start,
        (Next_Khewat - 1) AS Missing_End,
        (Next_Khewat - Khewat_No - 1) AS Gap_Size
    FROM OrderedKhewats
    WHERE (Next_Khewat - Khewat_No) > 1
)
-- STEP 4: FINAL REPORT
SELECT 
    ISNULL(T.mauza_name, 'Unknown Mauza') AS [Mauza_Name],
    ISNULL(T.district_name, '-') AS [District],
    ISNULL(T.tehsil_name, '-') AS [Tehsil],
    
    -- Range Format (Fastest Display)
    CAST(G.Missing_Start AS VARCHAR) + ' - ' + CAST(G.Missing_End AS VARCHAR) AS [Missing_Range],
    
    G.Gap_Size AS [Total_Missing_Count]

FROM Gaps G
LEFT JOIN territory.vw_Territory T ON G.mauza_id = T.mauza_id

ORDER BY [Mauza_Name], G.Missing_Start
OPTION (RECOMPILE, MAXDOP 0);

-- Cleanup
DROP TABLE #KhewatStage;
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;