OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

WITH RawData AS (
    SELECT 
        I.intiqal_id,
        I.intiqal_aprove_date, -- Added Date for sorting history
        REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, I.intiqal_no) AS VARCHAR(100)), CHAR(0), '') AS Mutation_No,
        REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no) AS VARCHAR(100)), CHAR(0), '') AS Khewat_No,

        -- Decrypt Name
        CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, P.first_name) AS NVARCHAR(MAX)) + ' ' + 
        ISNULL(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, P.last_name) AS NVARCHAR(MAX)), '') AS Person_Name,

        -- Get Raw Area Strings
        ISNULL(CAST(IPS.person_total_area AS VARCHAR(50)), '0-0-0') AS Total_Str,
        ISNULL(CAST(IPS.person_selling_area AS VARCHAR(50)), '0-0-0') AS Transferred_Str,
        
        -- Logic Trigger: Remaining Area existence defines the Role
        NULLIF(CAST(IPS.person_remaining_area AS VARCHAR(50)), '') AS Remaining_Str

    FROM transactions.Intiqal I
    INNER JOIN transactions.IntiqalLogicalPartition ILP ON I.intiqal_id = ILP.intiqal_id
    INNER JOIN transactions.IntiqalPersonShare IPS ON ILP.intiqal_logicalpartition_id = IPS.intiqal_logicalpartition_id
    INNER JOIN rhz.Khewat K ON ILP.khewat_id = K.khewat_id
    LEFT JOIN reference.Person P ON IPS.person_id = P.person_id
    
    WHERE 
      -- 1. Filter by your Mauza (Using ID from previous context)
      K.mauza_id = 'e5cc68e1-47fd-4ad8-aaa6-f3db2a4d91c5' 
      
      -- 2. Filter by Khewat '346'
      AND REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no) AS VARCHAR(100)), CHAR(0), '') = '346'
      
      -- 3. Only Show Implemented (Approved) Mutations
      AND I.is_approved = 1
),
RoleLogic AS (
    SELECT 
        *,
        -- Auto-Detect Role: If Remaining Area is recorded, they are Seller. Otherwise Buyer.
        CASE 
            WHEN Remaining_Str IS NOT NULL THEN 'Seller (Giver)'
            ELSE 'Buyer (Receiver)'
        END AS Role
    FROM RawData
),
CalculatedMarlas AS (
    SELECT 
        Mutation_No,
        intiqal_aprove_date,
        Khewat_No,
        Person_Name,
        Role,
        
        -- Convert Strings to Float Marlas for Calculation
        (TRY_CAST(PARSENAME(REPLACE(Total_Str, '-', '.'), 3) AS FLOAT) * 20 + 
         TRY_CAST(PARSENAME(REPLACE(Total_Str, '-', '.'), 2) AS FLOAT) + 
         TRY_CAST(PARSENAME(REPLACE(Total_Str, '-', '.'), 1) AS FLOAT) / 272.25) AS Total_Val,

        (TRY_CAST(PARSENAME(REPLACE(Transferred_Str, '-', '.'), 3) AS FLOAT) * 20 + 
         TRY_CAST(PARSENAME(REPLACE(Transferred_Str, '-', '.'), 2) AS FLOAT) + 
         TRY_CAST(PARSENAME(REPLACE(Transferred_Str, '-', '.'), 1) AS FLOAT) / 272.25) AS Transferred_Val
    FROM RoleLogic
)
SELECT 
    Mutation_No,
    intiqal_aprove_date AS [Approved_Date],
    Khewat_No,
    Person_Name,
    Role,

    -- 1. Area Before
    -- Seller: Uses Total directly. 
    -- Buyer: Uses (Total - Transferred) because they didn't have the new land yet.
    CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END) / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END)) - (FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END) / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND(((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END) - FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END))) * 272.25, 0) AS INT) AS VARCHAR) AS [Area_Before (K-M-F)],

    -- 2. Area Transferred (Actual Transaction)
    CAST(FLOOR(Transferred_Val / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR(Transferred_Val) - (FLOOR(Transferred_Val / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND((Transferred_Val - FLOOR(Transferred_Val)) * 272.25, 0) AS INT) AS VARCHAR) AS [Area_Transferred (K-M-F)],

    -- 3. Area After
    -- Seller: Uses (Total - Transferred) because they gave it away.
    -- Buyer: Uses Total directly (New Balance).
    CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END)) - (FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND(((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) - FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END))) * 272.25, 0) AS INT) AS VARCHAR) AS [Area_After (K-M-F)]

FROM CalculatedMarlas
ORDER BY intiqal_aprove_date ASC, Mutation_No, Role DESC;

CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;