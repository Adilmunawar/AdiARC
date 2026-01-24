OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';
OPEN SYMMETRIC KEY UserKey DECRYPTION BY CERTIFICATE Usercert;

WITH RawData AS (
    SELECT 
        I.intiqal_id,
        REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, I.intiqal_no) AS VARCHAR(100)), CHAR(0), '') AS Mutation_No,
        REPLACE(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, K.khewat_no) AS VARCHAR(100)), CHAR(0), '') AS Khewat_No,

        -- Decrypt Name
        CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, P.first_name) AS NVARCHAR(MAX)) + ' ' + 
        ISNULL(CAST(decryptbykeyautocert(cert_id('Usercert'), NULL, P.last_name) AS NVARCHAR(MAX)), '') AS Person_Name,

        -- Get Raw Area Strings
        ISNULL(CAST(IPS.person_total_area AS VARCHAR(50)), '0-0-0') AS Total_Str,
        ISNULL(CAST(IPS.person_selling_area AS VARCHAR(50)), '0-0-0') AS Transferred_Str,
        
        -- We use Remaining Area to detect the Role (Seller has 0-0-0, Buyer has NULL/Empty)
        NULLIF(CAST(IPS.person_remaining_area AS VARCHAR(50)), '') AS Remaining_Str

    FROM transactions.Intiqal I
    INNER JOIN transactions.IntiqalLogicalPartition ILP ON I.intiqal_id = ILP.intiqal_id
    INNER JOIN transactions.IntiqalPersonShare IPS ON ILP.intiqal_logicalpartition_id = IPS.intiqal_logicalpartition_id
    INNER JOIN rhz.Khewat K ON ILP.khewat_id = K.khewat_id
    LEFT JOIN reference.Person P ON IPS.person_id = P.person_id
    
    WHERE I.intiqal_id IN (
        'e26ef74e-383c-449c-aa81-005dc68078d3',
        'd1306294-eaeb-4c7e-a087-0066d7ed7783',
        '51a418ff-634c-4d4d-9591-006bb42b7d05',
        '68b753a7-e71d-4f31-ba99-0077d4117da6',
        '16ff591c-7a95-496f-a96b-009e9c07b9dd',
        '83b95e8c-5776-435b-9446-00bf8ad22843',
        'd50a2312-9933-4a68-831a-00d011ebb762',
        '465ac1dc-4cd8-481d-a732-00e0c633a48e',
        'f58aa230-f403-4394-ad67-00f470eea48a',
        'c15eef6e-70ef-4eee-b568-0110cc0eee8c',
        '96ec7ad8-b11d-4e1b-929a-016eb5581326',
        '713feab9-c876-4dec-985a-01a7bc32fb02',
        'a2dbc441-1f16-4651-885e-01cc6ac5c9ec',
        '4efe1e16-3961-470e-95d8-020a08cdeb83',
        '458a4dc8-c7fc-42f0-bd19-02307ced3d0f',
        '32009a1c-0aa3-41f7-a707-02598e36c5f3',
        'e667ac2b-ec81-46d6-af8b-028b09ce4dd7',
        'a80ae489-3d68-4ab5-a342-028c077fa2d8',
        '5ae58b9c-fcb4-4f9b-8390-028cf6c9162d',
        '37bc086f-ea08-4735-8d91-02a1292a1b83'
    )
),
RoleLogic AS (
    SELECT 
        *,
        -- Logic: If Remaining Area exists (even 0-0-0), they are the Seller. If NULL, Buyer.
        CASE 
            WHEN Remaining_Str IS NOT NULL THEN 'Seller (Giver)'
            ELSE 'Buyer (Receiver)'
        END AS Role
    FROM RawData
),
CalculatedMarlas AS (
    SELECT 
        Mutation_No,
        Khewat_No,
        Person_Name,
        Role,
        Total_Str,
        Transferred_Str,
        Remaining_Str,

        -- Convert Strings to Float Marlas for Math
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
    Khewat_No,
    Person_Name,
    Role,

    -- 1. Area Before
    -- Seller: Uses "Total" directly. 
    -- Buyer: Uses "Total - Transferred".
    CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END) / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END)) - (FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END) / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND(((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END) - FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val ELSE Total_Val - Transferred_Val END))) * 272.25, 0) AS INT) AS VARCHAR) AS [Area_Before (K-M-F)],

    -- 2. Area Transferred (Same for both)
    Transferred_Str AS [Area_Transferred (K-M-F)],

    -- 3. Area After
    -- Seller: Uses "Remaining" directly (or Total - Transferred).
    -- Buyer: Uses "Total" directly.
    CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) / 20) AS VARCHAR) + '-' + 
    CAST(CAST(FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END)) - (FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) / 20) * 20) AS INT) AS VARCHAR) + '-' + 
    CAST(CAST(ROUND(((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END) - FLOOR((CASE WHEN Role = 'Seller (Giver)' THEN Total_Val - Transferred_Val ELSE Total_Val END))) * 272.25, 0) AS INT) AS VARCHAR) AS [Area_After (K-M-F)]

FROM CalculatedMarlas
ORDER BY Mutation_No, Role DESC;

CLOSE SYMMETRIC KEY UserKey;
CLOSE MASTER KEY;