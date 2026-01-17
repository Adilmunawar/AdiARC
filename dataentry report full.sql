WITH 
-- 1. Count Shajra (Family Tree) Entries
ShajraCounts AS (
    SELECT user_id, COUNT(familytree_id) as cnt 
    FROM [familytree].[FamilyTree] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
),
-- 2. Count Ownership Entries
OwnershipCounts AS (
    SELECT user_id, COUNT(ownership_id) as cnt
    FROM [rhz].[Ownership] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
),
-- 3. Count Khasra Entries
KhasraCounts AS (
    SELECT user_id, COUNT(khasra_id) as cnt
    FROM [rhz].[Khasra] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
),
-- 4. Count Possession (Kashtkar) Entries
PossessionCounts AS (
    SELECT user_id, COUNT(possession_id) as cnt
    FROM [rhz].[Possession] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
)

-- 5. Combine All Data
SELECT 
    sys.fn_varbintohexstr(U.user_name) AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    ISNULL(S.cnt, 0) AS [Shajra (Family Tree)],
    ISNULL(O.cnt, 0) AS [Ownership],
    ISNULL(K.cnt, 0) AS [Khasra],
    ISNULL(P.cnt, 0) AS [Possession (Kashtkar)],
    
    (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) AS [Total Entries Today]

FROM [users].[User] U WITH (NOLOCK)
LEFT JOIN ShajraCounts S ON U.user_id = S.user_id
LEFT JOIN OwnershipCounts O ON U.user_id = O.user_id
LEFT JOIN KhasraCounts K ON U.user_id = K.user_id
LEFT JOIN PossessionCounts P ON U.user_id = P.user_id

-- 6. Filter: Show only users who did at least ONE entry today
WHERE (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) > 0

ORDER BY [Total Entries Today] DESC;