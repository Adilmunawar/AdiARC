DECLARE @MauzaID UNIQUEIDENTIFIER = 'c01936bb-8c59-4f61-9c15-bedfbc7fa5d1';

WITH MissingNumbers AS (
    -- 1. Get all Shajra Numbers present in IMAGES (Converted to clean Integers)
    SELECT TRY_CAST(doc_number AS INT) AS ShajraNo
    FROM transactions.TransactionImages WITH (NOLOCK)
    WHERE mauza_id = @MauzaID 
      AND transaction_type = N'شجرہ'
      AND TRY_CAST(doc_number AS INT) IS NOT NULL -- Only valid numbers

    EXCEPT -- <== FASTEST WAY TO SUBTRACT DATA

    -- 2. Subtract Shajra Numbers that already exist in DATA ENTRY
    SELECT TRY_CAST(family_no AS INT)
    FROM familytree.FamilyTree WITH (NOLOCK)
    WHERE mauza_id = @MauzaID
      AND TRY_CAST(family_no AS INT) IS NOT NULL
),
RangeGrouping AS (
    -- 3. Calculate "Islands" to create ranges
    SELECT 
        ShajraNo,
        -- Logic: If numbers are sequential (5,6,7), the difference between Value and RowNum is constant
        ShajraNo - ROW_NUMBER() OVER (ORDER BY ShajraNo) AS Grp
    FROM MissingNumbers
)
-- 4. Final Output: Show Ranges
SELECT 
    MIN(ShajraNo) AS [Missing From],
    MAX(ShajraNo) AS [Missing To],
    COUNT(*) AS [Total Missing In Range]
FROM RangeGrouping
GROUP BY Grp
ORDER BY [Missing From];