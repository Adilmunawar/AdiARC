-- 1. SET THE DATE RANGE HERE
DECLARE @StartDate DATE = '2026-01-01'; -- Start Date (YYYY-MM-DD)
DECLARE @EndDate DATE = CAST(GETDATE() AS DATE); -- Today

-- 2. (OPTIONAL) SET MAUZA ID IF NEEDED
-- DECLARE @MauzaID UNIQUEIDENTIFIER = 'YOUR-MAUZA-ID-HERE'; 

WITH 
-- 1. Count Shajra (Family Tree) Entries over the period
ShajraCounts AS (
    SELECT user_id, COUNT(familytree_id) as cnt 
    FROM [familytree].[FamilyTree] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) >= @StartDate 
      AND CAST(access_date_time AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID -- <== Uncomment if needed
    GROUP BY user_id
),
-- 2. Count Ownership Entries over the period
OwnershipCounts AS (
    SELECT user_id, COUNT(ownership_id) as cnt
    FROM [rhz].[Ownership] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) >= @StartDate 
      AND CAST(access_datetime AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID -- <== Uncomment if needed
    GROUP BY user_id
),
-- 3. Count Khasra Entries over the period
KhasraCounts AS (
    SELECT user_id, COUNT(khasra_id) as cnt
    FROM [rhz].[Khasra] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) >= @StartDate 
      AND CAST(access_date_time AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID -- <== Uncomment if needed
    GROUP BY user_id
),
-- 4. Count Possession (Kashtkar) Entries over the period
PossessionCounts AS (
    SELECT user_id, COUNT(possession_id) as cnt
    FROM [rhz].[Possession] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) >= @StartDate 
      AND CAST(access_datetime AS DATE) <= @EndDate
      -- AND mauza_id = @MauzaID -- <== Uncomment if needed
    GROUP BY user_id
)

-- 5. Combine All Data
SELECT 
    'From ' + CAST(@StartDate AS VARCHAR) + ' To ' + CAST(@EndDate AS VARCHAR) AS [Report Period],
    sys.fn_varbintohexstr(U.user_name) AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    ISNULL(S.cnt, 0) AS [Shajra (Total)],
    ISNULL(O.cnt, 0) AS [Ownership (Total)],
    ISNULL(K.cnt, 0) AS [Khasra (Total)],
    ISNULL(P.cnt, 0) AS [Possession (Total)],
    
    (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) AS [Grand Total Entries]

FROM [users].[User] U WITH (NOLOCK)
LEFT JOIN ShajraCounts S ON U.user_id = S.user_id
LEFT JOIN OwnershipCounts O ON U.user_id = O.user_id
LEFT JOIN KhasraCounts K ON U.user_id = K.user_id
LEFT JOIN PossessionCounts P ON U.user_id = P.user_id

-- 6. Filter: Show only users who did at least ONE entry in this period
WHERE (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) > 0

ORDER BY [Grand Total Entries] DESC;