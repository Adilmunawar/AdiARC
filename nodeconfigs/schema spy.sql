SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'transactions'
    AND TABLE_NAME IN ('IntiqalPersonInfo', 'IntiqalKhasra', 'IntiqalPersonShare')
ORDER BY 
    TABLE_NAME, COLUMN_NAME;