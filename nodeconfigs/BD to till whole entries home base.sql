-- 1. SET THE DATE RANGE HERE
DECLARE @StartDate DATE = '2025-04-12'; -- Start Date
DECLARE @EndDate DATE = CAST(GETDATE() AS DATE); -- Today (End Date)

-- 2. (OPTIONAL) SET MAUZA ID IF NEEDED
-- DECLARE @MauzaID UNIQUEIDENTIFIER = 'YOUR-MAUZA-ID-HERE'; 

WITH 
-- 1. Shajra (Family Tree)
ShajraCounts AS (
    SELECT user_id, COUNT(familytree_id) as cnt 
    FROM [familytree].[FamilyTree] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) >= @StartDate 
      AND CAST(access_date_time AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID 
    GROUP BY user_id
),
-- 2. Ownership (Khewat)
OwnershipCounts AS (
    SELECT user_id, COUNT(ownership_id) as cnt
    FROM [rhz].[Ownership] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) >= @StartDate 
      AND CAST(access_datetime AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID 
    GROUP BY user_id
),
-- 3. Khatoni (New)
KhatuniCounts AS (
    SELECT user_id, COUNT(khatuni_id) as cnt
    FROM [rhz].[Khatuni] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) >= @StartDate 
      AND CAST(access_datetime AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID 
    GROUP BY user_id
),
-- 4. Khasra
KhasraCounts AS (
    SELECT user_id, COUNT(khasra_id) as cnt
    FROM [rhz].[Khasra] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) >= @StartDate 
      AND CAST(access_date_time AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID 
    GROUP BY user_id
),
-- 5. Possession (Kashtkar)
PossessionCounts AS (
    SELECT user_id, COUNT(possession_id) as cnt
    FROM [rhz].[Possession] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) >= @StartDate 
      AND CAST(access_datetime AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID 
    GROUP BY user_id
),
-- 6. Kaifiat / Remarks (New)
KaifiatCounts AS (
    SELECT user_id, COUNT(remarks_id) as cnt
    FROM [rhz].[Remarks] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) >= @StartDate 
      AND CAST(access_datetime AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID -- (Note: Some Remarks tables might use khewat_id instead of mauza_id directly, check your specific db structure if filtering by mauza)
    GROUP BY user_id
)

-- 7. Combine All Data
SELECT 
    'From ' + CAST(@StartDate AS VARCHAR) + ' To ' + CAST(@EndDate AS VARCHAR) AS [Report Period],
    sys.fn_varbintohexstr(U.user_name) AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    ISNULL(S.cnt, 0) AS [Shajra],
    ISNULL(O.cnt, 0) AS [Ownership (Khewat)],
    ISNULL(Kh.cnt, 0) AS [Khatuni],          -- New Column
    ISNULL(K.cnt, 0) AS [Khasra],
    ISNULL(P.cnt, 0) AS [Possession],
    ISNULL(R.cnt, 0) AS [Kaifiat (Remarks)], -- New Column
    
    (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(Kh.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0) + ISNULL(R.cnt, 0)) AS [Grand Total Entries]

FROM [users].[User] U WITH (NOLOCK)
LEFT JOIN ShajraCounts S ON U.user_id = S.user_id
LEFT JOIN OwnershipCounts O ON U.user_id = O.user_id
LEFT JOIN KhatuniCounts Kh ON U.user_id = Kh.user_id
LEFT JOIN KhasraCounts K ON U.user_id = K.user_id
LEFT JOIN PossessionCounts P ON U.user_id = P.user_id
LEFT JOIN KaifiatCounts R ON U.user_id = R.user_id

-- 8. Filter: Show only users who did at least ONE entry in any category
WHERE (
    ISNULL(S.cnt, 0) + 
    ISNULL(O.cnt, 0) + 
    ISNULL(Kh.cnt, 0) + 
    ISNULL(K.cnt, 0) + 
    ISNULL(P.cnt, 0) + 
    ISNULL(R.cnt, 0)
) > 0

ORDER BY [Grand Total Entries] DESC;