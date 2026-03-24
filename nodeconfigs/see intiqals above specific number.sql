SELECT 
    intiqal_no,
    intiqal_id,
    is_approved,
    mauza_name,
    intiqal_status
FROM 
    transactions.vw_Intiqaal
WHERE 
    mauza_id = '41402c3e-57ff-4435-9d79-183f6d6a90cb'
    AND CAST(intiqal_no AS INT) > 7698
    and is_approved is null
ORDER BY 
    CAST(intiqal_no AS INT);