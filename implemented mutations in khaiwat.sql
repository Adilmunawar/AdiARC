OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

SELECT 
    -- Convert to VARCHAR first to prevent UTF-16 character shifting
    REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, I.intiqal_no) AS VARCHAR(100)), CHAR(0), '') AS [Mutation_Number],
    
    I.intiqal_aprove_date AS [Implementation_Date],
    IT.intiqal_type_description AS [Mutation_Type],
    
    COUNT(DISTINCT IPS.person_id) AS [Total_Persons_Involved],
    'Implemented' AS [Status]

FROM 
    transactions.Intiqal I WITH (NOLOCK)
INNER JOIN 
    transactions.IntiqalLogicalPartition ILP WITH (NOLOCK) ON I.intiqal_id = ILP.intiqal_id
INNER JOIN 
    rhz.Khewat K WITH (NOLOCK) ON ILP.khewat_id = K.khewat_id
LEFT JOIN 
    transactions.IntiqalPersonShare IPS WITH (NOLOCK) ON ILP.intiqal_logicalpartition_id = IPS.intiqal_logicalpartition_id
LEFT JOIN 
    Setup.IntiqalType IT ON I.intiqal_type_id = IT.intiqal_type_id

WHERE 
    K.mauza_id = 'e5cc68e1-47fd-4ad8-aaa6-f3db2a4d91c5'
    
    -- Applying the same fix to the filter to ensure it finds '102'
    AND REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no) AS VARCHAR(100)), CHAR(0), '') = '346'
    AND I.is_approved = 1

GROUP BY 
    I.intiqal_no, 
    I.intiqal_aprove_date, 
    IT.intiqal_type_description

ORDER BY 
    I.intiqal_aprove_date DESC;

CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;