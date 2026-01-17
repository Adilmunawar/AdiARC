SELECT 
    -- User ID (Hex format for App compatibility, remove sys.fn... if running directly in SSMS)
    sys.fn_varbintohexstr(U.user_name) AS [User Name], 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    -- Count of family members added/modified today
    COUNT(FT.familytree_id) AS [Total Members Entered (Today)]

FROM 
    [familytree].[FamilyTree] FT WITH (NOLOCK)
INNER JOIN 
    [users].[User] U WITH (NOLOCK) ON FT.user_id = U.user_id
WHERE 
    -- Filter for Today's Date
    CAST(FT.access_date_time AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY 
    U.user_name, 
    U.first_name, 
    U.last_name
ORDER BY 
    [Total Members Entered (Today)] DESC;