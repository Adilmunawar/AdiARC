DECLARE @ReportDate DATE = '2026-02-06'; -- <== CHANGE THIS DATE AS NEEDED
SELECT 
    @ReportDate AS [Report Date],
    U.user_name AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    SUM(CASE 
        WHEN I.is_approved = 1 
             AND CAST(I.intiqal_aprove_date AS DATE) = @ReportDate 
        THEN 1 
        ELSE 0 
    END) AS [Implemented],
    SUM(CASE 
        WHEN (I.is_approved = 0 OR I.is_approved IS NULL) 
             AND CAST(I.access_datetime AS DATE) = @ReportDate 
        THEN 1 
        ELSE 0 
    END) AS [Pending (Active)],
    COUNT(I.intiqal_id) AS [Total Activity]
FROM 
    [transactions].[Intiqal] I WITH (NOLOCK)
INNER JOIN 
    [users].[User] U WITH (NOLOCK) ON I.user_id = U.user_id
WHERE 
    CAST(I.access_datetime AS DATE) = @ReportDate
    OR CAST(I.intiqal_aprove_date AS DATE) = @ReportDate
GROUP BY 
    U.user_name, 
    U.first_name, 
    U.last_name
ORDER BY 
    [Implemented] DESC;