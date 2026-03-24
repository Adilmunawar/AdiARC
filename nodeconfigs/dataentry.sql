SELECT 
    -- This converts the binary ID into a readable text like '0x123...'
    CONVERT(VARCHAR(50), U.user_id, 1) AS [Readable_User_ID],
    COUNT(O.ownership_id) AS [Total Ownership Rows],
    CAST(O.access_datetime AS DATE) AS [Date],
    MIN(O.access_datetime) AS [First Entry At],
    MAX(O.access_datetime) AS [Last Entry At]
FROM rhz.Ownership O
JOIN users.[User] U ON O.user_id = U.user_id
WHERE CAST(O.access_datetime AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY U.user_id, CAST(O.access_datetime AS DATE)
ORDER BY [Total Ownership Rows] DESC;