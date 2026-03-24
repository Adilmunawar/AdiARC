-- Check what Transaction Types exist for this Mauza
SELECT DISTINCT transaction_type, COUNT(*) as cnt 
FROM transactions.TransactionImages 
WHERE mauza_id = 'c01936bb-8c59-4f61-9c15-bedfbc7fa5d1'
GROUP BY transaction_type;