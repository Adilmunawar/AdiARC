DECLARE @CheckDate DATE = '2026-01-02';

SELECT 
    COUNT(*) AS [Total Rows Found],
    SUM(CASE WHEN CAST(intiqal_date AS DATE) = @CheckDate THEN 1 ELSE 0 END) AS [Entered On Date],
    SUM(CASE WHEN CAST(intiqal_aprove_date AS DATE) = @CheckDate THEN 1 ELSE 0 END) AS [Approved On Date]
FROM transactions.Intiqal
WHERE CAST(intiqal_date AS DATE) = @CheckDate 
   OR CAST(intiqal_aprove_date AS DATE) = @CheckDate;