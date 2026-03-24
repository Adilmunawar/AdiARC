OPEN MASTER KEY DECRYPTION BY PASSWORD = 'DECRUPT KEY';

SELECT
    ISNULL(U.first_name + ' ' + ISNULL(U.last_name, ''), 'Unknown') AS [User Name],
    ISNULL(CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)), 'N/A') AS [Login ID],
    COUNT(CASE WHEN I.is_approved = 1 AND CAST(I.intiqal_aprove_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS [Implemented Today],
    COUNT(CASE WHEN I.intiqal_status = 1 THEN 1 END) AS [Pending]
FROM transactions.vw_Intiqaal I
LEFT JOIN users.[User] U ON I.USER_ID = U.user_id
GROUP BY I.USER_ID, U.first_name, U.last_name, U.user_name
HAVING COUNT(CASE WHEN I.is_approved = 1 AND CAST(I.intiqal_aprove_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) > 0
    OR COUNT(CASE WHEN I.intiqal_status = 1 THEN 1 END) > 0
ORDER BY [Implemented Today] DESC, [Pending] DESC;

CLOSE MASTER KEY;
