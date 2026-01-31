OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;
IF OBJECT_ID('tempdb..#KhewatStage') IS NOT NULL DROP TABLE #KhewatStage;
SELECT 
    K.mauza_id,
    -- Decrypt & Convert to INT (Safely ignoring '10/1' etc)
    TRY_CAST(REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, CONVERT(VARBINARY(MAX), K.khewat_no)) AS VARCHAR(100)), CHAR(0), '') AS INT) AS Khewat_No
INTO #KhewatStage
FROM rhz.Khewat K WITH (NOLOCK)
WHERE K.khewat_no IS NOT NULL;
CREATE CLUSTERED INDEX IX_Stage_Mauza_Khewat ON #KhewatStage(mauza_id, Khewat_No);
WITH OrderedKhewats AS (
    SELECT 
        mauza_id,
        Khewat_No,
        LEAD(Khewat_No) OVER (PARTITION BY mauza_id ORDER BY Khewat_No) AS Next_Khewat
    FROM #KhewatStage
    WHERE Khewat_No IS NOT NULL 
),
GapRanges AS (
    SELECT 
        mauza_id,
        (Khewat_No + 1) AS Missing_Start,
        (Next_Khewat - 1) AS Missing_End
    FROM OrderedKhewats
    WHERE (Next_Khewat - Khewat_No) > 1
),
IndividualNumbers AS (
    SELECT 
        mauza_id, 
        Missing_Start AS Missing_Num, 
        Missing_End
    FROM GapRanges
    UNION ALL
    SELECT 
        mauza_id, 
        Missing_Num + 1, 
        Missing_End
    FROM IndividualNumbers
    WHERE Missing_Num < Missing_End
)
SELECT 
    ISNULL(T.mauza_name, 'Unknown Mauza (ID: ' + CAST(N.mauza_id AS VARCHAR(50)) + ')') AS [Mauza_Name],
    ISNULL(T.district_name, '-') AS [District],
    ISNULL(T.tehsil_name, '-') AS [Tehsil],
    N.Missing_Num AS [Missing_Khewat_Number]
FROM IndividualNumbers N
LEFT JOIN territory.vw_Territory T ON N.mauza_id = T.mauza_id
ORDER BY [Mauza_Name], N.Missing_Num
OPTION (MAXRECURSION 0);
DROP TABLE #KhewatStage;
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;