OPEN MASTER KEY DECRYPTION BY PASSWORD = 'DECRYPT KEY';
DECLARE @TargetIntiqalID UNIQUEIDENTIFIER = 'f23752b7-79de-4463-82e4-94b2cac69d64';
SELECT 
    ActionDate AS [Timestamp],
    ISNULL(U.first_name + ' ' + ISNULL(U.last_name, ''), 'Unknown/Deleted') AS [User Name],
    ISNULL(CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)), 'N/A') AS [Login ID],
    [Source Table],
    [Activity Description]
FROM (
    SELECT access_datetime AS ActionDate, user_id, 'Visitor Info' AS [Source Table], 
           'Viewed Record (Type: ' + ISNULL(CAST(visitor_type AS NVARCHAR(MAX)), 'N/A') + ')' AS [Activity Description]
    FROM transactions.TransactionVisitorInfo WHERE transaction_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, user_id, 'Workflow Ops', 
           CAST(remarks AS NVARCHAR(MAX))
    FROM transactions.TransactionOperations WHERE transaction_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, fromId, 'Inbox (Sender)', 
           'Sent Message: ' + CAST(subject AS NVARCHAR(MAX))
    FROM transactions.Inbox WHERE transactionId = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, toId, 'Inbox (Receiver)', 
           'Received Message: ' + CAST(subject AS NVARCHAR(MAX))
    FROM transactions.Inbox WHERE transactionId = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, assignedBy_user_id, 'Job Assignment (By)', 
           'Assigned Task to another user'
    FROM workflow.JobAssignment WHERE transaction_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, assignedTo_user_id, 'Job Assignment (To)', 
           'Was Assigned a Task'
    FROM workflow.JobAssignment WHERE transaction_id = @TargetIntiqalID
    UNION ALL
    SELECT access_date_time, user_id, 'Report Log', 
           'Generated/Printed Report'
    FROM transactions.IntiqalReport WHERE intiqal_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, user_id, 'Charges/Fees', 
           'Updated Charges/Challan'
    FROM transactions.IntiqalCharges WHERE intiqal_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, user_id, 'Logical Partition', 
           'Modified Mutation Structure'
    FROM transactions.IntiqalLogicalPartition WHERE intiqal_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, user_id, 'Task Detail', 
           'Worked on Task Detail'
    FROM workflow.TaskDetail WHERE intiqal_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, user_id, 'System Log', 
           'Accessed Table: ' + CAST(tablename AS NVARCHAR(MAX))
    FROM users.UsersLog WHERE transaction_id = @TargetIntiqalID
    UNION ALL
    SELECT access_datetime, user_id, 'History Log', 
           'Status Change: ' + CAST(intiqal_status AS NVARCHAR(MAX))
    FROM transactions.HistoryIntiqal WHERE intiqal_id = @TargetIntiqalID
) AS AllEvents
LEFT JOIN users.[User] U ON AllEvents.user_id = U.user_id
WHERE AllEvents.user_id IS NOT NULL 
ORDER BY AllEvents.ActionDate DESC;
CLOSE MASTER KEY;