OPEN MASTER KEY DECRYPTION BY PASSWORD = 'key';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

WITH RawData AS (
    SELECT 
        I.intiqal_id,
        I.intiqal_aprove_date,
        
        -- 1. Decrypt Mutation & Khewat (Keep this if numbers are still encrypted)
        REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, I.intiqal_no) AS VARCHAR(100)), CHAR(0), '') AS Mutation_No,
        REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no) AS VARCHAR(100)), CHAR(0), '') AS Khewat_No,

        -- 2. UNIVERSAL PERSON CHECK (PLAIN TEXT - NO DECRYPTION)
        -- We check History first, then Reference, then Temp.
        COALESCE(
            -- Check HistoryPerson (Likely for Approved Mutations)
            CAST(HP.first_name AS NVARCHAR(MAX)) + ' ' + ISNULL(CAST(HP.last_name AS NVARCHAR(MAX)), ''),

            -- Check Reference Person (Standard Data)
            CAST(RP.first_name AS NVARCHAR(MAX)) + ' ' + ISNULL(CAST(RP.last_name AS NVARCHAR(MAX)), ''),

            -- Check Temporary Person (Active Data)
            CAST(TP.first_name AS NVARCHAR(MAX)) + ' ' + ISNULL(CAST(TP.last_name AS NVARCHAR(MAX)), ''),

            'Unknown Person'
        ) AS Person_Name,

        -- 3. Area Strings
        ISNULL(CAST(IPS.person_total_area AS VARCHAR(50)), '0-0-0') AS Total_Str,
        ISNULL(CAST(IPS.person_selling_area AS VARCHAR(50)), '0-0-0') AS Transferred_Str,
        NULLIF(CAST(IPS.person_remaining_area AS VARCHAR(50)), '') AS Remaining_Str,
        
        -- 4. Mutation Type
        IT.intiqal_type_description AS Mutation_Type

    FROM transactions.Intiqal I
    INNER JOIN transactions.IntiqalLogicalPartition ILP ON I.intiqal_id = ILP.intiqal_id
    INNER JOIN transactions.IntiqalPersonShare IPS ON ILP.intiqal_logicalpartition_id = IPS.intiqal_logicalpartition_id
    INNER JOIN rhz.Khewat K ON ILP.khewat_id = K.khewat_id
    
    -- JOIN ALL CANDIDATES
    LEFT JOIN reference.HistoryPerson HP ON IPS.person_id = HP.person_id
    LEFT JOIN reference.Person RP ON IPS.person_id = RP.person_id
    LEFT JOIN tmp.Person TP ON IPS.person_id = TP.person_id

    LEFT JOIN Setup.IntiqalType IT ON I.intiqal_type_id = IT.intiqal_type_id
    
    WHERE 
      K.mauza_id = 'c01936bb-8c59-4f61-9c15-bedfbc7fa5d1' 
      AND I.is_approved = 1
),
CalculatedValues AS (
    SELECT 
        *,
        -- Determine Role
        CASE WHEN Remaining_Str IS NOT NULL THEN 'Seller (Giver)' ELSE 'Buyer (Receiver)' END AS Role,
        
        -- Parse Marlas for Math
        (TRY_CAST(PARSENAME(REPLACE(Total_Str, '-', '.'), 3) AS FLOAT) * 20 + 
         TRY_CAST(PARSENAME(REPLACE(Total_Str, '-', '.'), 2) AS FLOAT) + 
         TRY_CAST(PARSENAME(REPLACE(Total_Str, '-', '.'), 1) AS FLOAT) / 272.25) AS Total_Val,

        (TRY_CAST(PARSENAME(REPLACE(Transferred_Str, '-', '.'), 3) AS FLOAT) * 20 + 
         TRY_CAST(PARSENAME(REPLACE(Transferred_Str, '-', '.'), 2) AS FLOAT) + 
         TRY_CAST(PARSENAME(REPLACE(Transferred_Str, '-', '.'), 1) AS FLOAT) / 272.25) AS Transferred_Val
    FROM RawData
)
SELECT 
    Mutation_No,
    CAST(intiqal_aprove_date AS DATE) AS [Approved_Date],
    Mutation_Type,
    Khewat_No,
    Person_Name,
    Role,
    
    -- Formatted Area
    CAST(FLOOR(Transferred_Val / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR(Transferred_Val) - (FLOOR(Transferred_Val / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND((Transferred_Val - FLOOR(Transferred_Val)) * 272.25, 0) AS INT) AS VARCHAR) AS [Area_Transferred (K-M-F)],

    -- New Balance
    CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END)) - (FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND(((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) - FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END))) * 272.25, 0) AS INT) AS VARCHAR) AS [New_Balance (K-M-F)]

FROM CalculatedValues
ORDER BY intiqal_aprove_date ASC, Mutation_No, Role DESC;

CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;