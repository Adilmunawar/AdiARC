-- Open the security keys using your password
OPEN MASTER KEY DECRYPTION BY PASSWORD = 'masterkey';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

WITH DecryptedData AS (
    -- Step 1: Decrypt binary shares into strings first
    SELECT 
        khewat_id,
        is_active,
        CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, person_share) AS VARCHAR(100)) AS person_share_str
    FROM rhz.Ownership WITH (NOLOCK)
)
SELECT 
    -- Decrypting Khaiwat Number
    ISNULL(CONVERT(VARCHAR(50), decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no)), 'N/A') AS [Khaiwat_Number],
    
    -- Decrypting the master share capacity
    ISNULL(CONVERT(VARCHAR(50), decryptbykeyautocert(cert_id('Usercert'), NULL, K.total_share)), 'N/A') AS [Stored_Total_Share],

    -- Step 2: Now parse the strings safely
    CAST(SUM(TRY_CAST(LEFT(D.person_share_str, CHARINDEX('/', D.person_share_str + '/') - 1) AS INT)) AS VARCHAR(20)) 
    + '/' + 
    CAST(MAX(TRY_CAST(SUBSTRING(D.person_share_str, CHARINDEX('/', D.person_share_str + '/') + 1, 20) AS INT)) AS VARCHAR(20)) AS [Aggregated_Owner_Share_Sum],

    M.mauza_name AS [Mauza_Name]

FROM 
    rhz.Khewat K WITH (NOLOCK)
INNER JOIN 
    territory.Mauza M WITH (NOLOCK) ON K.mauza_id = M.mauza_id
LEFT JOIN 
    DecryptedData D ON K.khewat_id = D.khewat_id 
WHERE 
    K.mauza_id = '84421a00-c40a-45c7-8ab4-ec30089dd903'
    AND K.is_active = 1
    AND (D.is_active = 1 OR D.is_active IS NULL)
GROUP BY 
    K.khewat_id, 
    K.khewat_no, 
    K.total_share,
    M.mauza_name
ORDER BY 
    TRY_CAST(CONVERT(VARCHAR(50), decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no)) AS INT);

-- Close the keys
CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;