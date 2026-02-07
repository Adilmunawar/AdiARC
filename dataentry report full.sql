DECLARE @ReportDate DATE = '2026-02-06'; -- <== CHANGE THIS DATE AS NEEDED
WITH 
ShajraCounts AS (
    SELECT user_id, COUNT(familytree_id) as cnt 
    FROM [familytree].[FamilyTree] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) = @ReportDate
    GROUP BY user_id
),
OwnershipCounts AS (
    SELECT user_id, COUNT(ownership_id) as cnt
    FROM [rhz].[Ownership] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) = @ReportDate
    GROUP BY user_id
),
KhasraCounts AS (
    SELECT user_id, COUNT(khasra_id) as cnt
    FROM [rhz].[Khasra] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) = @ReportDate
    GROUP BY user_id
),
PossessionCounts AS (
    SELECT user_id, COUNT(possession_id) as cnt
    FROM [rhz].[Possession] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) = @ReportDate
    GROUP BY user_id
)
SELECT 
    @ReportDate AS [Report Date], 
    sys.fn_varbintohexstr(U.user_name) AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    ISNULL(S.cnt, 0) AS [Shajra (Family Tree)],
    ISNULL(O.cnt, 0) AS [Ownership],
    ISNULL(K.cnt, 0) AS [Khasra],
    ISNULL(P.cnt, 0) AS [Possession (Kashtkar)],
    
    (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) AS [Total Entries]

FROM [users].[User] U WITH (NOLOCK)
LEFT JOIN ShajraCounts S ON U.user_id = S.user_id
LEFT JOIN OwnershipCounts O ON U.user_id = O.user_id
LEFT JOIN KhasraCounts K ON U.user_id = K.user_id
LEFT JOIN PossessionCounts P ON U.user_id = P.user_id
WHERE (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) > 0

ORDER BY [Total Entries] DESC;