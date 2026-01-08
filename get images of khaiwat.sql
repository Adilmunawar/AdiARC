SELECT 
    TI.page_no AS [Page_No],
    (
        SELECT SI.image_file AS [*] 
        FROM transactions.ScanImages SI 
        WHERE SI.image_id = TI.image_id 
        FOR XML PATH(''), TYPE
    ) AS [Click_This_Link_For_Full_Hex]
FROM 
    transactions.TransactionImages TI
WHERE 
    TI.transaction_id = '6b9cc057-a786-4745-9592-781e12896a17'
ORDER BY 
    TI.page_no ASC;