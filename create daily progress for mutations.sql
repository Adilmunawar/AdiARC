SELECT 
    U.user_name AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    SUM(CASE 
        WHEN I.is_approved = 1 
             AND CAST(I.intiqal_aprove_date AS DATE) = CAST(GETDATE() AS DATE) 
        THEN 1 
        ELSE 0 
    END) AS [Implemented Today],

    SUM(CASE 
        WHEN (I.is_approved = 0 OR I.is_approved IS NULL) 
             AND CAST(I.access_datetime AS DATE) = CAST(GETDATE() AS DATE) 
        THEN 1 
        ELSE 0 
    END) AS [Pending (Active Today)],

    COUNT(I.intiqal_id) AS [Total Activity Today]

FROM 
    [transactions].[Intiqal] I WITH (NOLOCK)
INNER JOIN 
    [users].[User] U WITH (NOLOCK) ON I.user_id = U.user_id
WHERE 
    CAST(I.access_datetime AS DATE) = CAST(GETDATE() AS DATE)
    OR CAST(I.intiqal_aprove_date AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY 
    U.user_name, 
    U.first_name, 
    U.last_name
ORDER BY 
    [Implemented Today] DESC;